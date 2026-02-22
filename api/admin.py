from django.contrib import admin
from .models import Employee, ClothesItem, ClothesStockBatch
from .models import Department, Service, Position


admin.site.register(Department)
admin.site.register(Service)
admin.site.register(Position)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    search_fields = ('last_name', 'first_name', 'middle_name')
    list_filter = ('department', 'service', 'position')


@admin.register(ClothesStockBatch)
class ClothesStockBatchAdmin(admin.ModelAdmin):
    list_display = (
        'item',
        'size',
        'quantity',
    )

    list_filter = (
        'item__type',    # фильтр по типу одежды (TOP/SHOES/OTHER)
        'item',          # фильтр по конкретному виду одежды
        'size',          # фильтр по размерам
    )

    search_fields = (
        'item__name',
        'size',
    )

    ordering = ('item__name', 'size')

    # Для удобства редактирования
    fieldsets = (
        ("Информация о партии", {
            "fields": ("item", "size", "quantity")
        }),
        ("Примечание", {
            "fields": ("note",),
            "classes": ("collapse",)
        }),
    )



#  Admin для ClothesItem (справочник одежды)
@admin.register(ClothesItem)
class ClothesItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'type')
    list_filter = ('type',)
    search_fields = ('name',)







