"""Dynamic database connections for organization workspaces."""

from copy import deepcopy
import os
import re

from django.conf import settings
from django.db import connections


DATABASE_NAME_PATTERN = re.compile(r"^[A-Za-z0-9_]+$")


def get_organization_database_alias(organization):
    return f"organization_{organization.pk}"


def get_organization_database_env_prefix(organization):
    slug = organization.slug.upper().replace("-", "_")
    return f"BIOCLEAN_ORGANIZATION_{slug}_DATABASE"


def register_organization_database(organization):
    """Register an organization's MySQL database under a stable Django alias."""
    if not DATABASE_NAME_PATTERN.fullmatch(organization.database_name):
        raise ValueError("Organization database name contains unsupported characters.")

    alias = get_organization_database_alias(organization)
    if alias not in connections.databases:
        database_config = deepcopy(settings.DATABASES["default"])
        prefix = get_organization_database_env_prefix(organization)
        database_config["NAME"] = organization.database_name
        database_config["USER"] = os.getenv(
            f"{prefix}_USER", database_config.get("USER", "")
        )
        database_config["PASSWORD"] = os.getenv(
            f"{prefix}_PASSWORD", database_config.get("PASSWORD", "")
        )
        database_config["HOST"] = os.getenv(
            f"{prefix}_HOST", database_config.get("HOST", "127.0.0.1")
        )
        database_config["PORT"] = os.getenv(
            f"{prefix}_PORT", database_config.get("PORT", "3306")
        )
        connections.databases[alias] = database_config

    return alias
