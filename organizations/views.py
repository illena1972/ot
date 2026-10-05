from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import PPE_WARNING_DAY_CHOICES


@ensure_csrf_cookie
@api_view(["GET", "PATCH"])
@permission_classes([AllowAny])
def current_organization(request):
    """Return the current organization and update its dashboard preference."""
    organization = getattr(request, "organization", None)
    if organization is None:
        return Response(
            {"detail": "Организация для текущего адреса не определена."},
            status=404,
        )

    if request.method == "PATCH":
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Требуется вход в систему."},
                status=403,
            )
        value = request.data.get("ppe_warning_days")
        try:
            value = int(value)
        except (TypeError, ValueError):
            value = None
        allowed_values = {choice[0] for choice in PPE_WARNING_DAY_CHOICES}
        if value not in allowed_values:
            return Response(
                {"ppe_warning_days": [
                    "Выберите период: 30, 60, 90, 180 или 360 дней."
                ]},
                status=400,
            )

        organization.ppe_warning_days = value
        organization.save(update_fields=["ppe_warning_days"])

    return Response({
        "id": organization.id,
        "name": organization.name,
        "slug": organization.slug,
        "ppe_warning_days": organization.ppe_warning_days,
    })


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.get_full_name(),
        "roles": list(user.groups.values_list("name", flat=True)),
    }


@csrf_protect
@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    username = str(request.data.get("username", "")).strip()
    password = str(request.data.get("password", ""))
    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response({"detail": "Неверный логин или пароль."}, status=400)
    if not user.is_active:
        return Response({"detail": "Учетная запись отключена."}, status=403)

    login(request, user)
    return Response({"user": serialize_user(user)})


@api_view(["POST"])
def logout_user(request):
    logout(request)
    return Response(status=204)


@api_view(["GET"])
def current_user(request):
    return Response({"user": serialize_user(request.user)})
