from django.contrib import admin

from .models import Organization, OrganizationDomain


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
