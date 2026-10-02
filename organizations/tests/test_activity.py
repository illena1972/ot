from datetime import date, datetime, timezone as datetime_timezone
from io import StringIO
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.http import HttpResponse
from django.test import SimpleTestCase, override_settings

from organizations.activity import (
    SESSION_ACTIVITY_KEY,
    OrganizationActivityMiddleware,
    record_user_activity,
)


@override_settings(
    PLATFORM_DATABASE_ALIAS="platform",
    ACTIVITY_TIME_ZONE="Europe/Moscow",
    ACTIVITY_WRITE_INTERVAL_SECONDS=300,
)
class RecordUserActivityTests(SimpleTestCase):
    def make_request(self):
        user = SimpleNamespace(
            is_authenticated=True,
            get_username=lambda: "client_admin",
        )
        return SimpleNamespace(
            organization=SimpleNamespace(pk=3),
            user=user,
            session={},
        )

    @patch("organizations.activity.OrganizationUserActivity")
    @patch("organizations.activity.timezone.now")
    def test_creates_daily_activity_and_throttles_next_request(
        self,
        now,
        activity_model,
    ):
        current = datetime(2026, 10, 1, 7, 30, tzinfo=datetime_timezone.utc)
        now.return_value = current
        request = self.make_request()
        queryset = MagicMock()
        activity_model.objects.using.return_value = queryset
        queryset.get_or_create.return_value = (SimpleNamespace(pk=9), True)

        record_user_activity(request)
        record_user_activity(request)

        queryset.get_or_create.assert_called_once()
        self.assertEqual(
            queryset.get_or_create.call_args.kwargs["activity_date"],
            date(2026, 10, 1),
        )
        self.assertEqual(request.session[SESSION_ACTIVITY_KEY], current.timestamp())
        queryset.filter.assert_not_called()

    @patch("organizations.activity.OrganizationUserActivity")
    @patch("organizations.activity.timezone.now")
    def test_updates_last_seen_for_existing_daily_activity(
        self,
        now,
        activity_model,
    ):
        current = datetime(2026, 10, 1, 12, 0, tzinfo=datetime_timezone.utc)
        now.return_value = current
        request = self.make_request()
        queryset = MagicMock()
        activity_model.objects.using.return_value = queryset
        queryset.get_or_create.return_value = (SimpleNamespace(pk=11), False)

        record_user_activity(request)

        queryset.filter.assert_called_once_with(pk=11)
        queryset.filter.return_value.update.assert_called_once_with(
            last_seen_at=current
        )

    @patch("organizations.activity.OrganizationUserActivity")
    def test_ignores_anonymous_request(self, activity_model):
        request = SimpleNamespace(
            organization=SimpleNamespace(pk=3),
            user=SimpleNamespace(is_authenticated=False),
            session={},
        )

        record_user_activity(request)

        activity_model.objects.using.assert_not_called()

    @patch("organizations.activity.record_user_activity")
    def test_logging_failure_does_not_break_application(self, record_activity):
        record_activity.side_effect = RuntimeError("platform unavailable")
        middleware = OrganizationActivityMiddleware(
            lambda request: HttpResponse("ok")
        )

        with self.assertLogs("organizations.activity", level="ERROR"):
            response = middleware(SimpleNamespace())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"ok")


@override_settings(
    PLATFORM_DATABASE_ALIAS="platform",
    ACTIVITY_TIME_ZONE="Europe/Moscow",
)
class OrganizationActivityCommandTests(SimpleTestCase):
    @patch("organizations.management.commands.organization_activity.OrganizationUserActivity")
    @patch("organizations.management.commands.organization_activity.Organization")
    def test_prints_activity_in_configured_timezone(
        self,
        organization_model,
        activity_model,
    ):
        organization = SimpleNamespace(name="Client")
        organization_model.objects.using.return_value.get.return_value = organization
        row = SimpleNamespace(
            activity_date=date(2026, 10, 1),
            username="client_admin",
            first_seen_at=datetime(
                2026,
                10,
                1,
                7,
                0,
                tzinfo=datetime_timezone.utc,
            ),
            last_seen_at=datetime(
                2026,
                10,
                1,
                13,
                45,
                tzinfo=datetime_timezone.utc,
            ),
        )
        queryset = activity_model.objects.using.return_value
        queryset.filter.return_value.order_by.return_value = [row]
        output = StringIO()

        call_command(
            "organization_activity",
            organization="client",
            date_from="2026-10-01",
            date_to="2026-10-01",
            stdout=output,
        )

        text = output.getvalue()
        self.assertIn("01.10.2026", text)
        self.assertIn("client_admin", text)
        self.assertIn("10:00", text)
        self.assertIn("16:45", text)
        self.assertIn("Дней активности: 1", text)
