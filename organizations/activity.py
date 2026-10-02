import logging
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import IntegrityError
from django.utils import timezone

from .models import OrganizationUserActivity


logger = logging.getLogger(__name__)
SESSION_ACTIVITY_KEY = "_bioclean_activity_recorded_at"


def record_user_activity(request):
    organization = getattr(request, "organization", None)
    user = getattr(request, "user", None)
    if organization is None or user is None or not user.is_authenticated:
        return

    now = timezone.now()
    last_recorded_at = request.session.get(SESSION_ACTIVITY_KEY)
    interval = settings.ACTIVITY_WRITE_INTERVAL_SECONDS
    if last_recorded_at is not None:
        try:
            if now.timestamp() - float(last_recorded_at) < interval:
                return
        except (TypeError, ValueError):
            pass

    activity_timezone = ZoneInfo(settings.ACTIVITY_TIME_ZONE)
    activity_date = timezone.localtime(now, activity_timezone).date()
    platform_alias = settings.PLATFORM_DATABASE_ALIAS
    queryset = OrganizationUserActivity.objects.using(platform_alias)
    lookup = {
        "organization": organization,
        "username": user.get_username(),
        "activity_date": activity_date,
    }

    try:
        activity, created = queryset.get_or_create(
            **lookup,
            defaults={
                "first_seen_at": now,
                "last_seen_at": now,
            },
        )
    except IntegrityError:
        activity = queryset.get(**lookup)
        created = False

    if not created:
        queryset.filter(pk=activity.pk).update(last_seen_at=now)

    request.session[SESSION_ACTIVITY_KEY] = now.timestamp()


class OrganizationActivityMiddleware:
    """Record authenticated organization activity without affecting requests."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            record_user_activity(request)
        except Exception:
            logger.exception("Could not record organization user activity")
        return response
