from django.conf import settings

from .context import get_organization_database_alias


class OrganizationDatabaseRouter:
    """Keeps the platform registry apart from organization operational data."""

    platform_app_label = "organizations"

    def db_for_read(self, model, **hints):
        if model._meta.app_label == self.platform_app_label:
            return settings.PLATFORM_DATABASE_ALIAS
        return get_organization_database_alias()

    def db_for_write(self, model, **hints):
        if model._meta.app_label == self.platform_app_label:
            return settings.PLATFORM_DATABASE_ALIAS
        return get_organization_database_alias()

    def allow_relation(self, obj1, obj2, **hints):
        if obj1._meta.app_label == self.platform_app_label:
            return obj2._meta.app_label == self.platform_app_label
        if obj2._meta.app_label == self.platform_app_label:
            return False
        return None

    def allow_migrate(self, db, app_label, **hints):
        if app_label == self.platform_app_label:
            return db == settings.PLATFORM_DATABASE_ALIAS
        return db != settings.PLATFORM_DATABASE_ALIAS
