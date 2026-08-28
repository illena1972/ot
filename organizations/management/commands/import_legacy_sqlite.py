import os
import tempfile
import json
from pathlib import Path

from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import connections
from django.utils import timezone

from api.models import (
    ClothesIssue,
    ClothesIssueItem,
    ClothesItem,
    Department,
    Employee,
    Position,
    Service,
    Stock,
)


MODELS = (
    Department,
    Service,
    Position,
    ClothesItem,
    Employee,
    Stock,
    ClothesIssue,
    ClothesIssueItem,
)

# Historical duplicates that are no longer allowed by the application.
# The key is the normalized spelling, and the value is the approved label.
CANONICAL_POSITION_NAMES = {
    "старший мастер": "Старший мастер",
}


class Command(BaseCommand):
    help = "Imports PPE records from the previous SQLite database into the current database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default=str(settings.BASE_DIR / "db.sqlite3"),
            help="Path to the source SQLite database.",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Back up and replace existing PPE data in the target database.",
        )

    def handle(self, *args, **options):
        source_path = Path(options["source"])
        if not source_path.is_file():
            raise CommandError(f"SQLite source database was not found: {source_path}")

        backup_path = None
        if self._target_has_data():
            if not options["replace"]:
                raise CommandError(
                    "The target database already contains PPE data. "
                    "Use --replace to create a backup and replace it."
                )

            backup_path = self._backup_target_data()
            self.stdout.write(f"Backup created: {backup_path}")
            self._clear_target_data()

        if Employee.objects.exists():
            raise CommandError(
                "The target database already contains employees. Import was cancelled to avoid duplicate data."
            )

        source_alias = "legacy_sqlite"
        connections.databases[source_alias] = {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": source_path,
            "USER": "",
            "PASSWORD": "",
            "HOST": "",
            "PORT": "",
            "OPTIONS": {},
            "ATOMIC_REQUESTS": False,
            "AUTOCOMMIT": True,
            "CONN_MAX_AGE": 0,
            "CONN_HEALTH_CHECKS": False,
            "TIME_ZONE": None,
            "TEST": {},
        }

        file_descriptor, fixture_path = tempfile.mkstemp(
            prefix="bioclean_legacy_", suffix=".json"
        )
        os.close(file_descriptor)

        try:
            self.stdout.write("Reading PPE data from the previous SQLite database...")
            with open(fixture_path, "w", encoding="utf-8") as fixture_file:
                call_command(
                    "dumpdata",
                    "api",
                    database=source_alias,
                    stdout=fixture_file,
                    verbosity=0,
                )

            removed_positions = self._normalize_positions(fixture_path)
            if removed_positions:
                self.stdout.write(
                    "Merged historical duplicate positions: "
                    + ", ".join(removed_positions)
                )

            self.stdout.write("Importing PPE data into MySQL...")
            try:
                call_command("loaddata", fixture_path, database="default", verbosity=0)
            except Exception:
                if backup_path:
                    self.stderr.write("Import failed. Restoring the MySQL backup...")
                    call_command("loaddata", str(backup_path), database="default", verbosity=0)
                raise

            source_counts = self._get_counts(source_alias)
            source_counts[Position._meta.verbose_name_plural] -= len(removed_positions)
            target_counts = self._get_counts("default")
            if source_counts != target_counts:
                raise CommandError(
                    "The import completed, but record counts do not match. "
                    f"SQLite: {source_counts}; MySQL: {target_counts}"
                )

            self.stdout.write(self.style.SUCCESS("Import completed successfully."))
            for model_name, count in target_counts.items():
                self.stdout.write(f"  {model_name}: {count}")
        finally:
            connections[source_alias].close()
            connections.databases.pop(source_alias, None)
            Path(fixture_path).unlink(missing_ok=True)

    @staticmethod
    def _get_counts(database):
        return {
            model._meta.verbose_name_plural: model.objects.using(database).count()
            for model in MODELS
        }

    @staticmethod
    def _target_has_data():
        return any(model.objects.exists() for model in MODELS)

    def _backup_target_data(self):
        backup_dir = Path(settings.BASE_DIR) / "backups"
        backup_dir.mkdir(exist_ok=True)
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        backup_path = backup_dir / f"mysql_api_before_import_{timestamp}.json"

        with open(backup_path, "w", encoding="utf-8") as fixture_file:
            call_command(
                "dumpdata",
                "api",
                database="default",
                stdout=fixture_file,
                verbosity=0,
            )

        return backup_path

    @staticmethod
    def _clear_target_data():
        # Delete children before their referenced records to preserve FK integrity.
        ClothesIssueItem.objects.all().delete()
        ClothesIssue.objects.all().delete()
        Stock.objects.all().delete()
        Employee.objects.all().delete()
        ClothesItem.objects.all().delete()
        Department.objects.all().delete()
        Service.objects.all().delete()
        Position.objects.all().delete()

    @staticmethod
    def _normalize_positions(fixture_path):
        with open(fixture_path, encoding="utf-8") as fixture_file:
            records = json.load(fixture_file)

        positions = [record for record in records if record["model"] == "api.position"]
        position_by_name = {
            record["fields"]["name"].strip().casefold(): record
            for record in positions
        }
        replacement_ids = {}
        removed_names = []

        for normalized_name, canonical_name in CANONICAL_POSITION_NAMES.items():
            matching_positions = [
                record
                for record in positions
                if record["fields"]["name"].strip().casefold() == normalized_name
            ]
            if len(matching_positions) < 2:
                continue

            canonical_position = next(
                (
                    record
                    for record in matching_positions
                    if record["fields"]["name"] == canonical_name
                ),
                position_by_name[normalized_name],
            )
            canonical_id = canonical_position["pk"]

            for duplicate_position in matching_positions:
                duplicate_id = duplicate_position["pk"]
                if duplicate_id != canonical_id:
                    replacement_ids[duplicate_id] = canonical_id
                    removed_names.append(duplicate_position["fields"]["name"])

        if not replacement_ids:
            return []

        for record in records:
            if record["model"] == "api.employee":
                position_id = record["fields"].get("position")
                if position_id in replacement_ids:
                    record["fields"]["position"] = replacement_ids[position_id]

        records = [
            record
            for record in records
            if not (
                record["model"] == "api.position"
                and record["pk"] in replacement_ids
            )
        ]

        with open(fixture_path, "w", encoding="utf-8") as fixture_file:
            json.dump(records, fixture_file, ensure_ascii=False)

        return removed_names
