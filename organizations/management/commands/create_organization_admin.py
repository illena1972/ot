from getpass import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.management import BaseCommand, CommandError
from django.core.exceptions import ValidationError

from organizations.context import (
    reset_organization_database_alias,
    set_organization_database_alias,
)
from organizations.database import register_organization_database
from organizations.models import Organization


ADMINISTRATOR_GROUP = "Администратор"


class Command(BaseCommand):
    help = "Создает первого администратора в отдельной базе организации."

    def add_arguments(self, parser):
        parser.add_argument("--organization", required=True, help="Код организации")
        parser.add_argument("--username", required=True, help="Логин администратора")

    def handle(self, *args, **options):
        slug = options["organization"].strip().lower()
        username = options["username"].strip()
        if not username:
            raise CommandError("Укажите логин администратора.")

        try:
            organization = Organization.objects.using("platform").get(
                slug=slug,
                is_active=True,
            )
        except Organization.DoesNotExist as error:
            raise CommandError("Активная организация с таким кодом не найдена.") from error

        alias = register_organization_database(organization)
        token = set_organization_database_alias(alias)
        try:
            user_model = get_user_model()
            if user_model.objects.filter(username=username).exists():
                raise CommandError("Пользователь с таким логином уже существует.")

            password = self.prompt_for_password(user_model)
            user = user_model.objects.create_user(
                username=username,
                password=password,
                is_staff=True,
            )
            group, _ = Group.objects.get_or_create(name=ADMINISTRATOR_GROUP)
            user.groups.add(group)
        finally:
            reset_organization_database_alias(token)

        self.stdout.write(
            self.style.SUCCESS(
                f"Администратор '{username}' создан для организации '{organization.name}'."
            )
        )

    def prompt_for_password(self, user_model):
        while True:
            password = getpass("Пароль: ")
            confirmation = getpass("Повторите пароль: ")
            if password != confirmation:
                self.stderr.write("Пароли не совпадают. Повторите ввод.")
                continue
            try:
                validate_password(password, user=user_model(username="temporary"))
            except ValidationError as error:
                self.stderr.write(" ".join(error.messages))
                continue
            return password
