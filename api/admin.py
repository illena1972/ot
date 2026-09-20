from django.contrib import admin
from .models import Employee, ClothesItem, IssueNorm, IssueNormItem
from .models import Department, Service, Position


admin.site.register(Department)
admin.site.register(Service)
admin.site.register(Position)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    search_fields = ('last_name', 'first_name', 'middle_name')
    list_filter = ('department', 'service', 'position')


#  Admin для ClothesItem (справочник одежды)
@admin.register(ClothesItem)
class ClothesItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'type')
    list_filter = ('type',)
    search_fields = ('name',)


class IssueNormItemInline(admin.TabularInline):
    model = IssueNormItem
    extra = 1


@admin.register(IssueNorm)
class IssueNormAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    inlines = (IssueNormItemInline,)







