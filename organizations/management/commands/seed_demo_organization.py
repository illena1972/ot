from django.core.management import BaseCommand, CommandError
from django.utils import timezone

from api.demo_data import DemoDataAlreadyExists, seed_demo_database
from organizations.context import (
    reset_organization_database_alias,
    set_organization_database_alias,
)
from organizations.database import register_organization_database
from organizations.models import Organization


class Command(BaseCommand):
    help = "Заполняет изолированную организацию demo безопасными презентационными данными."

    def add_arguments(self, parser):
        parser.add_argument(
            "--organization",
            default="demo",
            help="Код демонстрационной организации (разрешен только demo).",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Удалить прежние демонстрационные данные и создать набор заново.",
        )
        parser.add_argument(
            "--confirm-reset-demo",
            action="store_true",
            help="Обязательное подтверждение для использования --reset.",
        )

    def handle(self, *args, **options):
        slug = options["organization"].strip().lower()
        if slug != "demo":
            raise CommandError(
                "Команда работает только с организацией 'demo' и не может изменять клиентские базы."
            )
        if options["reset"] and not options["confirm_reset_demo"]:
            raise CommandError(
                "Для пересоздания данных добавьте --confirm-reset-demo."
            )

        try:
            organization = Organization.objects.using("platform").get(slug=slug)
        except Organization.DoesNotExist as error:
            raise CommandError(
                "Организация 'demo' не найдена. Сначала создайте отдельную базу и выполните provision_organization."
            ) from error

        if "demo" not in organization.database_name.lower():
            raise CommandError(
                "Имя базы демонстрационной организации должно содержать слово 'demo'."
            )

        alias = register_organization_database(organization)
        token = set_organization_database_alias(alias)
        try:
            result = seed_demo_database(
                alias,
                today=timezone.localdate(),
                reset=options["reset"],
            )
        except DemoDataAlreadyExists as error:
            raise CommandError(str(error)) from error
        finally:
            reset_organization_database_alias(token)

        self.stdout.write(self.style.SUCCESS("Демонстрационная база подготовлена."))
        self.stdout.write(
            "Создано: "
            f"сотрудников — {result['employees']}, "
            f"норм — {result['norms']}, "
            f"позиций СИЗ — {result['items']}, "
            f"выдач — {result['issues']}."
        )
        self.stdout.write(
            "Рабочий экран содержит примеры: просрочено, срок заканчивается и не выдано."
        )
