"""Request-scoped selection of an organization database."""

from contextvars import ContextVar


_organization_database_alias = ContextVar("organization_database_alias", default=None)


def get_organization_database_alias():
    return _organization_database_alias.get()


def set_organization_database_alias(alias):
    return _organization_database_alias.set(alias)


def reset_organization_database_alias(token):
    _organization_database_alias.reset(token)
