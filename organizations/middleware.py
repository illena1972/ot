from django.conf import settings
from django.http import HttpResponseNotFound

from .context import (
    reset_organization_database_alias,
    set_organization_database_alias,
)
from .database import register_organization_database
from .models import OrganizationDomain


class OrganizationDatabaseMiddleware:
    """Select the operational database from the request hostname."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.MULTI_TENANT_ENABLED:
            return self.get_response(request)

        hostname = request.META.get("HTTP_HOST", "").split(":", 1)[0].lower().rstrip(".")
        if not hostname:
            return HttpResponseNotFound("Адрес организации не указан.")
        try:
            domain = OrganizationDomain.objects.using(
                settings.PLATFORM_DATABASE_ALIAS
            ).select_related("organization").get(
                domain=hostname,
                organization__is_active=True,
            )
        except OrganizationDomain.DoesNotExist:
            return HttpResponseNotFound("Организация для этого адреса не найдена.")

        alias = register_organization_database(domain.organization)
        token = set_organization_database_alias(alias)
        request.organization = domain.organization
        try:
            return self.get_response(request)
        finally:
            reset_organization_database_alias(token)
