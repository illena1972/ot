from django.contrib import admin

from .models import Organization, OrganizationDomain, OrganizationUserActivity


class OrganizationDomainInline(admin.TabularInline):
    model = OrganizationDomain
    extra = 1


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "database_name", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "slug", "database_name")
    prepopulated_fields = {"slug": ("name",)}
    inlines = (OrganizationDomainInline,)


@admin.register(OrganizationUserActivity)
class OrganizationUserActivityAdmin(admin.ModelAdmin):
    list_display = (
        "activity_date",
        "organization",
        "username",
        "first_seen_at",
        "last_seen_at",
    )
    list_filter = ("organization", "activity_date")
    search_fields = ("organization__name", "organization__slug", "username")
    readonly_fields = (
        "organization",
        "username",
        "activity_date",
        "first_seen_at",
        "last_seen_at",
    )
