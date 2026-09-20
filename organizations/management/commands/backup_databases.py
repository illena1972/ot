import gzip
import json
import os
import re
import shutil
import sqlite3
import subprocess
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from pathlib import Path

from django.conf import settings
from django.core.management import BaseCommand, CommandError
from django.db import connections

from organizations.database import register_organization_database
from organizations.models import Organization


SAFE_FILENAME_PATTERN = re.compile(r"[^A-Za-z0-9_-]+")


class Command(BaseCommand):
    help = "Создает сжатые резервные копии центральной и клиентских баз MySQL."

    def add_arguments(self, parser):
        parser.add_argument("--output-dir", help="Каталог для резервных копий.")
        parser.add_argument(
            "--retention-days",
            type=int,
            help="Количество дней хранения копий.",
        )
        parser.add_argument("--mysqldump", help="Путь к mysqldump.")

    def handle(self, *args, **options):
        retention_days = options["retention_days"] or int(
            os.getenv("BIOCLEAN_BACKUP_RETENTION_DAYS", "31")
        )
        if retention_days < 1:
            raise CommandError("Срок хранения резервных копий должен быть больше 0.")

        backup_root = Path(
            options["output_dir"]
            or os.getenv("BIOCLEAN_BACKUP_DIR", settings.BASE_DIR / "backups" / "databases")
        ).expanduser().resolve()
        backup_root.mkdir(parents=True, exist_ok=True)
        self._restrict_permissions(backup_root, 0o700)

        now = datetime.now(timezone.utc)
        run_directory = backup_root / now.strftime("%Y-%m-%d")
        run_directory.mkdir(parents=True, exist_ok=True)
        self._restrict_permissions(run_directory, 0o700)

        targets = self._database_targets()
        needs_mysqldump = any(
            connections.databases[alias]["ENGINE"] == "django.db.backends.mysql"
            for _, alias in targets
        )
        mysqldump = None
        if needs_mysqldump:
            mysqldump = (
                options["mysqldump"]
                or os.getenv("BIOCLEAN_MYSQLDUMP_PATH")
                or shutil.which("mysqldump")
            )
            if not mysqldump:
                raise CommandError(
                    "Программа mysqldump не найдена. "
                    "Укажите BIOCLEAN_MYSQLDUMP_PATH в .env."
                )

        created_files = []

        for label, alias in targets:
            database = connections.databases[alias]
            engine = database["ENGINE"]
            if engine == "django.db.backends.mysql":
                extension = "sql.gz"
            elif engine == "django.db.backends.sqlite3":
                extension = "sqlite3.gz"
            else:
                raise CommandError(
                    f"База '{label}' использует неподдерживаемый для этой команды движок."
                )

            filename_label = SAFE_FILENAME_PATTERN.sub("_", label).strip("_")
            timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
            destination = run_directory / f"{timestamp}__{filename_label}.{extension}"

            self.stdout.write(f"Резервное копирование базы '{label}'...")
            if engine == "django.db.backends.mysql":
                self._dump_mysql(mysqldump, database, destination)
            else:
                self._dump_sqlite(alias, database, destination)
            created_files.append({
                "label": label,
                "database": str(database["NAME"]),
                "file": destination.name,
                "size": destination.stat().st_size,
                "sha256": self._sha256(destination),
            })

        manifest = run_directory / f"{now.strftime('%Y-%m-%d_%H-%M-%S')}__manifest.json"
        self._write_manifest(manifest, now, retention_days, created_files)
        removed = self._remove_expired_files(backup_root, now, retention_days)

        self.stdout.write(
            self.style.SUCCESS(
                f"Резервное копирование завершено: {len(created_files)} баз. "
                f"Удалено устаревших файлов: {removed}."
            )
        )

    def _database_targets(self):
        platform_alias = settings.PLATFORM_DATABASE_ALIAS
        targets = [("platform", platform_alias)]
        organizations = list(
            Organization.objects.using(platform_alias).all().order_by("slug")
        )

        for organization in organizations:
            targets.append((organization.slug, register_organization_database(organization)))

        if not organizations and "default" != platform_alias:
            targets.append(("default", "default"))

        unique_targets = []
        seen_connections = set()
        for label, alias in targets:
            database = connections.databases[alias]
            identity = (
                database.get("ENGINE"),
                str(database.get("NAME")),
                database.get("USER"),
                database.get("HOST"),
                str(database.get("PORT")),
            )
            if identity not in seen_connections:
                seen_connections.add(identity)
                unique_targets.append((label, alias))

        return unique_targets

    def _dump_mysql(self, executable, database, destination):
        temporary = destination.with_suffix(destination.suffix + ".tmp")
        raw_temporary = destination.with_suffix(".sql.tmp")
        environment = os.environ.copy()
        environment["MYSQL_PWD"] = database.get("PASSWORD", "")
        command = [
            str(executable),
            "--no-tablespaces",
            "--single-transaction",
            "--quick",
            "--default-character-set=utf8mb4",
            f"--host={database.get('HOST') or 'localhost'}",
            f"--port={database.get('PORT') or '3306'}",
            f"--user={database.get('USER') or ''}",
            str(database["NAME"]),
        ]

        try:
            with raw_temporary.open("wb") as output:
                result = subprocess.run(
                    command,
                    stdout=output,
                    stderr=subprocess.PIPE,
                    env=environment,
                    check=False,
                )
            if result.returncode != 0:
                error = result.stderr.decode("utf-8", errors="replace").strip()
                raise CommandError(
                    f"Не удалось создать копию базы '{database['NAME']}': {error}"
                )
            if raw_temporary.stat().st_size == 0:
                raise CommandError(
                    f"Копия базы '{database['NAME']}' получилась пустой."
                )

            with raw_temporary.open("rb") as source:
                with gzip.open(temporary, "wb", compresslevel=6) as output:
                    shutil.copyfileobj(source, output, length=1024 * 1024)

            os.replace(temporary, destination)
            self._restrict_permissions(destination, 0o600)
            self._verify_gzip(destination, database["NAME"])
        finally:
            temporary.unlink(missing_ok=True)
            raw_temporary.unlink(missing_ok=True)

    def _dump_sqlite(self, alias, database, destination):
        temporary = destination.with_suffix(destination.suffix + ".tmp")
        raw_temporary = destination.with_suffix(".sqlite3.tmp")

        try:
            connection = connections[alias]
            connection.ensure_connection()
            target = sqlite3.connect(raw_temporary)
            try:
                connection.connection.backup(target)
            finally:
                target.close()

            if not raw_temporary.exists() or raw_temporary.stat().st_size == 0:
                raise CommandError(
                    f"Копия базы '{database['NAME']}' получилась пустой."
                )

            with raw_temporary.open("rb") as source:
                with gzip.open(temporary, "wb", compresslevel=6) as output:
                    shutil.copyfileobj(source, output, length=1024 * 1024)

            os.replace(temporary, destination)
            self._restrict_permissions(destination, 0o600)
            self._verify_gzip(destination, database["NAME"])
        finally:
            temporary.unlink(missing_ok=True)
            raw_temporary.unlink(missing_ok=True)

    def _write_manifest(self, path, created_at, retention_days, files):
        temporary = path.with_suffix(path.suffix + ".tmp")
        data = {
            "created_at": created_at.isoformat(),
            "retention_days": retention_days,
            "databases": files,
        }
        temporary.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        os.replace(temporary, path)
        self._restrict_permissions(path, 0o600)

    def _remove_expired_files(self, backup_root, now, retention_days):
        cutoff = now - timedelta(days=retention_days)
        removed = 0
        for path in backup_root.rglob("*"):
            if not path.is_file() or path.name == "backup.log":
                continue
            modified = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
            if modified < cutoff:
                path.unlink()
                removed += 1

        for directory in sorted(backup_root.iterdir(), reverse=True):
            if directory.is_dir() and not any(directory.iterdir()):
                directory.rmdir()

        return removed

    @staticmethod
    def _sha256(path):
        digest = sha256()
        with path.open("rb") as source:
            for chunk in iter(lambda: source.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    @staticmethod
    def _verify_gzip(path, database_name):
        try:
            with gzip.open(path, "rb") as source:
                for _ in iter(lambda: source.read(1024 * 1024), b""):
                    pass
        except (OSError, EOFError) as error:
            path.unlink(missing_ok=True)
            raise CommandError(
                f"Не удалось проверить сжатую копию базы '{database_name}'."
            ) from error

    @staticmethod
    def _restrict_permissions(path, mode):
        try:
            path.chmod(mode)
        except OSError:
            pass
