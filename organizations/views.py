from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@ensure_csrf_cookie
@require_GET
def current_organization(request):
    """Return the organization resolved from the current request hostname."""
    organization = getattr(request, "organization", None)
    if organization is None:
        return JsonResponse(
            {"detail": "Организация для текущего адреса не определена."},
            status=404,
        )

    return JsonResponse(
        {
            "id": organization.id,
            "name": organization.name,
            "slug": organization.slug,
        }
    )


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
