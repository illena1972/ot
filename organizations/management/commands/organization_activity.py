from datetime import timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.management import BaseCommand, CommandError
from django.utils import timezone
from django.utils.dateparse import parse_date

from organizations.models import Organization, OrganizationUserActivity


class Command(BaseCommand):
    help = "Показывает дни и время активности пользователей организации."

    def add_arguments(self, parser):
        parser.add_argument("--organization", required=True, help="Код организации")
        parser.add_argument(
            "--date-from",
            help="Начальная дата в формате ГГГГ-ММ-ДД. По умолчанию 30 дней назад.",
        )
        parser.add_argument(
            "--date-to",
            help="Конечная дата в формате ГГГГ-ММ-ДД. По умолчанию сегодня.",
        )

    def handle(self, *args, **options):
        slug = options["organization"].strip().lower()
        platform_alias = settings.PLATFORM_DATABASE_ALIAS
        activity_timezone = ZoneInfo(settings.ACTIVITY_TIME_ZONE)
        today = timezone.localdate(timezone=activity_timezone)
        date_from = self.parse_requested_date(
            options.get("date_from"),
            "--date-from",
        ) or (today - timedelta(days=30))
        date_to = self.parse_requested_date(
            options.get("date_to"),
            "--date-to",
        ) or today

        if date_from > date_to:
            raise CommandError("Начальная дата не может быть позже конечной.")

        try:
            organization = Organization.objects.using(platform_alias).get(slug=slug)
        except Organization.DoesNotExist as error:
            raise CommandError(f"Организация с кодом '{slug}' не найдена.") from error

        rows = list(
            OrganizationUserActivity.objects.using(platform_alias)
            .filter(
                organization=organization,
                activity_date__range=(date_from, date_to),
            )
            .order_by("activity_date", "username")
        )

        self.stdout.write(
            f"Активность организации '{organization.name}' "
            f"с {date_from:%d.%m.%Y} по {date_to:%d.%m.%Y}:"
        )
        if not rows:
            self.stdout.write("Активность за выбранный период не зафиксирована.")
            return

        self.stdout.write("Дата       Пользователь              Первая  Последняя")
        self.stdout.write("---------- ------------------------- ------- ---------")
        for row in rows:
            first_seen = timezone.localtime(row.first_seen_at, activity_timezone)
            last_seen = timezone.localtime(row.last_seen_at, activity_timezone)
            self.stdout.write(
                f"{row.activity_date:%d.%m.%Y} "
                f"{row.username[:25]:<25} "
                f"{first_seen:%H:%M}   {last_seen:%H:%M}"
            )

        active_days = len({row.activity_date for row in rows})
        self.stdout.write(f"Дней активности: {active_days}")

    @staticmethod
    def parse_requested_date(value, option_name):
        if not value:
            return None
        parsed = parse_date(value)
        if parsed is None:
            raise CommandError(
                f"Некорректное значение {option_name}. Используйте формат ГГГГ-ММ-ДД."
            )
        return parsed
