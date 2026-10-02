from io import StringIO
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core.management import CommandError, call_command
from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase, override_settings

from organizations.middleware import OrganizationDatabaseMiddleware


@override_settings(PLATFORM_DATABASE_ALIAS="platform")
class SetOrganizationAccessCommandTests(SimpleTestCase):
    @patch("organizations.management.commands.set_organization_access.Organization")
    def test_disables_organization(self, organization_model):
        organization = MagicMock(name="organization")
        organization.name = "Client"
        organization.is_active = True
        organization_model.objects.using.return_value.get.return_value = organization
        output = StringIO()

        call_command(
            "set_organization_access",
            organization="client",
            disable=True,
            stdout=output,
        )

        self.assertFalse(organization.is_active)
        organization.save.assert_called_once_with(
            using="platform",
            update_fields=["is_active"],
        )
        self.assertIn("приостановлен", output.getvalue())

    @patch("organizations.management.commands.set_organization_access.Organization")
    def test_enables_organization(self, organization_model):
        organization = MagicMock(name="organization")
        organization.name = "Client"
        organization.is_active = False
        organization_model.objects.using.return_value.get.return_value = organization
        output = StringIO()

        call_command(
            "set_organization_access",
            organization="client",
            enable=True,
            stdout=output,
        )

        self.assertTrue(organization.is_active)
        organization.save.assert_called_once_with(
            using="platform",
            update_fields=["is_active"],
        )
        self.assertIn("возобновлен", output.getvalue())

    @patch("organizations.management.commands.set_organization_access.Organization")
    def test_rejects_unknown_organization(self, organization_model):
        class MissingOrganization(Exception):
            pass

        organization_model.DoesNotExist = MissingOrganization
        organization_model.objects.using.return_value.get.side_effect = MissingOrganization

        with self.assertRaisesMessage(CommandError, "missing"):
            call_command(
                "set_organization_access",
                organization="missing",
                disable=True,
            )


@override_settings(MULTI_TENANT_ENABLED=True, PLATFORM_DATABASE_ALIAS="platform")
class OrganizationDatabaseMiddlewareTests(SimpleTestCase):
    def setUp(self):
        self.request = RequestFactory().get("/", HTTP_HOST="client.app.bioclean.ru")

    @patch("organizations.middleware.register_organization_database")
    @patch("organizations.middleware.OrganizationDomain")
    def test_returns_clear_message_for_inactive_organization(
        self,
        organization_domain,
        register_database,
    ):
        organization = SimpleNamespace(is_active=False)
        organization_domain.objects.using.return_value.select_related.return_value.get.return_value = (
            SimpleNamespace(organization=organization)
        )
        middleware = OrganizationDatabaseMiddleware(lambda request: HttpResponse("ok"))

        response = middleware(self.request)

        self.assertEqual(response.status_code, 403)
        self.assertIn("Доступ к организации приостановлен", response.content.decode())
        register_database.assert_not_called()

    @patch("organizations.middleware.register_organization_database")
    @patch("organizations.middleware.OrganizationDomain")
    def test_active_organization_continues_to_application(
        self,
        organization_domain,
        register_database,
    ):
        organization = SimpleNamespace(is_active=True)
        organization_domain.objects.using.return_value.select_related.return_value.get.return_value = (
            SimpleNamespace(organization=organization)
        )
        register_database.return_value = "organization_1"
        middleware = OrganizationDatabaseMiddleware(lambda request: HttpResponse("ok"))

        response = middleware(self.request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"ok")
        self.assertIs(self.request.organization, organization)
        register_database.assert_called_once_with(organization)
