from django.core.management import BaseCommand, CommandError, call_command
from django.db import connections, transaction

from organizations.database import register_organization_database
from organizations.models import Organization, OrganizationDomain


class Command(BaseCommand):
    help = "Создает организацию и подготавливает ее отдельную рабочую базу."

    def add_arguments(self, parser):
        parser.add_argument("--name", required=True, help="Наименование организации")
        parser.add_argument("--slug", required=True, help="Код организации")
        parser.add_argument("--database-name", required=True, help="Имя уже созданной базы MySQL")
        parser.add_argument("--domain", required=True, help="Адрес организации без порта")

    def handle(self, *args, **options):
        name = options["name"].strip()
        slug = options["slug"].strip().lower()
        database_name = options["database_name"].strip()
        domain = options["domain"].strip().lower()

        if not name:
            raise CommandError("Укажите наименование организации.")
        if not domain:
            raise CommandError("Укажите адрес организации.")

        if Organization.objects.using("platform").filter(name=name).exists():
            raise CommandError("Организация с таким наименованием уже зарегистрирована.")
        if Organization.objects.using("platform").filter(slug=slug).exists():
            raise CommandError("Организация с таким кодом уже зарегистрирована.")
        if Organization.objects.using("platform").filter(database_name=database_name).exists():
            raise CommandError("Эта рабочая база уже назначена другой организации.")
        if OrganizationDomain.objects.using("platform").filter(domain=domain).exists():
            raise CommandError("Этот адрес уже назначен другой организации.")

        with transaction.atomic(using="platform"):
            organization = Organization.objects.using("platform").create(
                name=name,
                slug=slug,
                database_name=database_name,
            )
            OrganizationDomain.objects.using("platform").create(
                organization=organization,
                domain=domain,
                is_primary=True,
            )

        alias = register_organization_database(organization)
        try:
            with connections[alias].cursor() as cursor:
                cursor.execute("SELECT 1")
            call_command("migrate", database=alias, interactive=False, verbosity=options["verbosity"])
        except Exception as error:
            organization.delete(using="platform")
            raise CommandError(
                "Не удалось подключиться к рабочей базе или выполнить миграции. "
                "Проверьте имя базы и параметры организации в .env."
            ) from error

        self.stdout.write(self.style.SUCCESS(f"Организация '{organization.name}' подготовлена."))
