from django.http import JsonResponse
from django.views.decorators.http import require_GET


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
