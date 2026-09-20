from io import StringIO
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core.management import CommandError, call_command
from django.test import SimpleTestCase, override_settings


@override_settings(PLATFORM_DATABASE_ALIAS="platform")
class MigrateAllOrganizationsCommandTests(SimpleTestCase):
    def make_queryset(self, organizations):
        queryset = MagicMock()
        queryset.filter.return_value = queryset
        queryset.order_by.return_value = organizations
        return queryset

    @patch("organizations.management.commands.migrate_all_organizations.connections")
    @patch("organizations.management.commands.migrate_all_organizations.call_command")
    @patch("organizations.management.commands.migrate_all_organizations.register_organization_database")
    @patch("organizations.management.commands.migrate_all_organizations.Organization")
    def test_migrates_platform_and_each_active_organization(
        self,
        organization_model,
        register_database,
        mocked_call_command,
        mocked_connections,
    ):
        organizations = [
            SimpleNamespace(name="First", slug="first"),
            SimpleNamespace(name="Rostok", slug="rostok"),
        ]
        organization_model.objects.using.return_value = self.make_queryset(
            organizations
        )
        register_database.side_effect = ["organization_1", "organization_2"]
        mocked_connections.__getitem__.return_value = MagicMock()
        output = StringIO()

        call_command("migrate_all_organizations", stdout=output, verbosity=0)

        mocked_call_command.assert_any_call(
            "migrate",
            "organizations",
            database="platform",
            interactive=False,
            verbosity=0,
        )
        mocked_call_command.assert_any_call(
            "migrate",
            database="organization_1",
            interactive=False,
            verbosity=0,
        )
        mocked_call_command.assert_any_call(
            "migrate",
            database="organization_2",
            interactive=False,
            verbosity=0,
        )
        self.assertIn("first, rostok", output.getvalue())

    @patch("organizations.management.commands.migrate_all_organizations.call_command")
    @patch("organizations.management.commands.migrate_all_organizations.Organization")
    def test_rejects_unknown_requested_organization(
        self,
        organization_model,
        mocked_call_command,
    ):
        organization_model.objects.using.return_value = self.make_queryset([])

        with self.assertRaisesMessage(CommandError, "missing"):
            call_command(
                "migrate_all_organizations",
                organization="missing",
                verbosity=0,
            )

        mocked_call_command.assert_called_once()
