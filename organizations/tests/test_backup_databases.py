import gzip
import json
import sqlite3
from io import StringIO
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core.management import CommandError, call_command
from django.core.management import load_command_class
from django.test import SimpleTestCase, override_settings


MYSQL_DATABASES = {
    "platform": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "hosting_platform",
        "USER": "platform_user",
        "PASSWORD": "platform_secret",
        "HOST": "localhost",
        "PORT": "3306",
    },
    "organization_1": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "hosting_first",
        "USER": "first_user",
        "PASSWORD": "first_secret",
        "HOST": "localhost",
        "PORT": "3306",
    },
}


@override_settings(PLATFORM_DATABASE_ALIAS="platform")
class BackupDatabasesCommandTests(SimpleTestCase):
    def make_organization_queryset(self):
        queryset = MagicMock()
        queryset.all.return_value = queryset
        queryset.order_by.return_value = [
            SimpleNamespace(name="First", slug="first")
        ]
        return queryset

    @patch("organizations.management.commands.backup_databases.subprocess.run")
    @patch("organizations.management.commands.backup_databases.connections")
    @patch("organizations.management.commands.backup_databases.register_organization_database")
    @patch("organizations.management.commands.backup_databases.Organization")
    def test_creates_compressed_backups_without_password_in_command(
        self,
        organization_model,
        register_database,
        mocked_connections,
        mocked_run,
    ):
        from tempfile import TemporaryDirectory

        organization_model.objects.using.return_value = self.make_organization_queryset()
        register_database.return_value = "organization_1"
        mocked_connections.databases = MYSQL_DATABASES

        def write_dump(command, stdout, **kwargs):
            stdout.write(b"-- MySQL dump\nCREATE TABLE test (id int);\n")
            return SimpleNamespace(returncode=0, stderr=b"")

        mocked_run.side_effect = write_dump

        with TemporaryDirectory() as directory:
            output = StringIO()
            call_command(
                "backup_databases",
                output_dir=directory,
                retention_days=31,
                mysqldump="/usr/bin/mysqldump",
                stdout=output,
            )

            backups = sorted(Path(directory).rglob("*.sql.gz"))
            manifests = list(Path(directory).rglob("*__manifest.json"))

            self.assertEqual(len(backups), 2)
            self.assertEqual(len(manifests), 1)
            for backup in backups:
                with gzip.open(backup, "rb") as source:
                    self.assertIn(b"CREATE TABLE", source.read())

            manifest = json.loads(manifests[0].read_text(encoding="utf-8"))
            self.assertEqual(len(manifest["databases"]), 2)
            self.assertIn("Резервное копирование завершено", output.getvalue())

        for call in mocked_run.call_args_list:
            command = call.args[0]
            self.assertNotIn("platform_secret", command)
            self.assertNotIn("first_secret", command)
            self.assertIn("MYSQL_PWD", call.kwargs["env"])

    @patch("organizations.management.commands.backup_databases.subprocess.run")
    @patch("organizations.management.commands.backup_databases.connections")
    @patch("organizations.management.commands.backup_databases.Organization")
    def test_failed_dump_does_not_leave_partial_backup(
        self,
        organization_model,
        mocked_connections,
        mocked_run,
    ):
        from tempfile import TemporaryDirectory

        queryset = MagicMock()
        queryset.all.return_value = queryset
        queryset.order_by.return_value = []
        organization_model.objects.using.return_value = queryset
        mocked_connections.databases = {
            "platform": MYSQL_DATABASES["platform"],
            "default": MYSQL_DATABASES["organization_1"],
        }
        mocked_run.return_value = SimpleNamespace(
            returncode=2,
            stderr=b"access denied",
        )

        with TemporaryDirectory() as directory:
            with self.assertRaisesMessage(CommandError, "access denied"):
                call_command(
                    "backup_databases",
                    output_dir=directory,
                    retention_days=31,
                    mysqldump="/usr/bin/mysqldump",
                )

            self.assertFalse(list(Path(directory).rglob("*.sql.gz")))
            self.assertFalse(list(Path(directory).rglob("*.tmp")))

    @patch("organizations.management.commands.backup_databases.connections")
    def test_creates_consistent_compressed_sqlite_backup(self, mocked_connections):
        from tempfile import TemporaryDirectory

        with TemporaryDirectory() as directory:
            source_path = Path(directory) / "source.sqlite3"
            destination = Path(directory) / "backup.sqlite3.gz"
            source = sqlite3.connect(source_path)
            source.execute("CREATE TABLE employee (name text)")
            source.execute("INSERT INTO employee VALUES ('Иванов')")
            source.commit()

            django_connection = MagicMock()
            django_connection.connection = source
            mocked_connections.__getitem__.return_value = django_connection
            command = load_command_class("organizations", "backup_databases")
            command._dump_sqlite(
                "default",
                {
                    "ENGINE": "django.db.backends.sqlite3",
                    "NAME": source_path,
                },
                destination,
            )

            restored_path = Path(directory) / "restored.sqlite3"
            with gzip.open(destination, "rb") as compressed:
                restored_path.write_bytes(compressed.read())

            restored = sqlite3.connect(restored_path)
            try:
                row = restored.execute("SELECT name FROM employee").fetchone()
            finally:
                restored.close()
                source.close()

            self.assertEqual(row, ("Иванов",))
