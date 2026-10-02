from django.conf import settings
from django.core.management import BaseCommand, CommandError

from organizations.models import Organization


class Command(BaseCommand):
    help = "Приостанавливает или возобновляет доступ организации к системе."

    def add_arguments(self, parser):
        parser.add_argument("--organization", required=True, help="Код организации")
        action = parser.add_mutually_exclusive_group(required=True)
        action.add_argument(
            "--disable",
            action="store_true",
            help="Приостановить доступ организации.",
        )
        action.add_argument(
            "--enable",
            action="store_true",
            help="Возобновить доступ организации.",
        )

    def handle(self, *args, **options):
        slug = options["organization"].strip().lower()
        platform_alias = settings.PLATFORM_DATABASE_ALIAS

        try:
            organization = Organization.objects.using(platform_alias).get(slug=slug)
        except Organization.DoesNotExist as error:
            raise CommandError(f"Организация с кодом '{slug}' не найдена.") from error

        should_be_active = bool(options["enable"])
        if organization.is_active == should_be_active:
            state = "уже активна" if should_be_active else "уже приостановлена"
            self.stdout.write(f"Организация '{organization.name}' {state}.")
            return

        organization.is_active = should_be_active
        organization.save(using=platform_alias, update_fields=["is_active"])

        if should_be_active:
            message = f"Доступ организации '{organization.name}' возобновлен."
        else:
            message = f"Доступ организации '{organization.name}' приостановлен."
        self.stdout.write(self.style.SUCCESS(message))
