from types import SimpleNamespace
from unittest.mock import MagicMock

from django.contrib.auth import get_user_model
from django.test import RequestFactory, SimpleTestCase
from rest_framework.test import force_authenticate

from organizations.views import current_organization


class CurrentOrganizationSettingsTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = get_user_model()(username="admin")

    def make_organization(self, warning_days=60):
        organization = SimpleNamespace(
            id=1,
            name="Client",
            slug="client",
            ppe_warning_days=warning_days,
            save=MagicMock(),
        )
        return organization

    def test_updates_warning_days(self):
        request = self.factory.patch(
            "/api/organization/current/",
            data='{"ppe_warning_days": 90}',
            content_type="application/json",
        )
        force_authenticate(request, user=self.user)
        organization = self.make_organization()
        request.organization = organization

        response = current_organization(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["ppe_warning_days"], 90)
        organization.save.assert_called_once_with(
            update_fields=["ppe_warning_days"]
        )

    def test_rejects_warning_days_outside_range(self):
        request = self.factory.patch(
            "/api/organization/current/",
            data='{"ppe_warning_days": 45}',
            content_type="application/json",
        )
        force_authenticate(request, user=self.user)
        organization = self.make_organization()
        request.organization = organization

        response = current_organization(request)

        self.assertEqual(response.status_code, 400)
        organization.save.assert_not_called()

    def test_rejects_anonymous_setting_update(self):
        request = self.factory.patch(
            "/api/organization/current/",
            data='{"ppe_warning_days": 45}',
            content_type="application/json",
        )
        organization = self.make_organization()
        request.organization = organization

        response = current_organization(request)

        self.assertEqual(response.status_code, 403)
        organization.save.assert_not_called()
