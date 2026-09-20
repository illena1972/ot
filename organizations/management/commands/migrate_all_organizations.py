from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import connections

from organizations.database import register_organization_database
from organizations.models import Organization


class Command(BaseCommand):
    help = "Применяет миграции к центральной базе и рабочим базам организаций."

    def add_arguments(self, parser):
        parser.add_argument(
            "--organization",
            help="Обновить только организацию с указанным кодом.",
        )

    def handle(self, *args, **options):
        platform_alias = settings.PLATFORM_DATABASE_ALIAS
        verbosity = options["verbosity"]

        self.stdout.write("Обновление центральной базы организаций...")
        try:
            call_command(
                "migrate",
                "organizations",
                database=platform_alias,
                interactive=False,
                verbosity=verbosity,
            )
        except Exception as error:
            raise CommandError(
                "Не удалось обновить центральную базу организаций."
            ) from error

        organizations = Organization.objects.using(platform_alias).filter(
            is_active=True
        )
        slug = (options.get("organization") or "").strip().lower()
        if slug:
            organizations = organizations.filter(slug=slug)

        organizations = list(organizations.order_by("slug"))
        if slug and not organizations:
            raise CommandError(f"Активная организация с кодом '{slug}' не найдена.")

        if not organizations:
            self.stdout.write(self.style.WARNING("Активные организации не найдены."))
            return

        updated = []
        for organization in organizations:
            alias = register_organization_database(organization)
            self.stdout.write(
                f"Обновление организации '{organization.name}' ({organization.slug})..."
            )
            try:
                connections[alias].ensure_connection()
                call_command(
                    "migrate",
                    database=alias,
                    interactive=False,
                    verbosity=verbosity,
                )
            except Exception as error:
                raise CommandError(
                    "Не удалось обновить организацию "
                    f"'{organization.name}' ({organization.slug}). "
                    "Остальные базы после нее не обновлялись."
                ) from error
            finally:
                connections[alias].close()
            updated.append(organization.slug)

        self.stdout.write(
            self.style.SUCCESS(
                "Миграции применены. Обновлены организации: "
                + ", ".join(updated)
            )
        )
