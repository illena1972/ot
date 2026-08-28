"""Dynamic database connections for organization workspaces."""

from copy import deepcopy
import re

from django.conf import settings
from django.db import connections


DATABASE_NAME_PATTERN = re.compile(r"^[A-Za-z0-9_]+$")


def get_organization_database_alias(organization):
    return f"organization_{organization.pk}"


def register_organization_database(organization):
    """Register an organization's MySQL database under a stable Django alias."""
    if not DATABASE_NAME_PATTERN.fullmatch(organization.database_name):
        raise ValueError("Organization database name contains unsupported characters.")

    alias = get_organization_database_alias(organization)
    if alias not in connections.databases:
        database_config = deepcopy(settings.DATABASES["default"])
        database_config["NAME"] = organization.database_name
        connections.databases[alias] = database_config

    return alias
