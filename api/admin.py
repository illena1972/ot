from django.contrib import admin
from .models import ClothesStockBatch, ClothesItem, ClothesIssue


@admin.register(ClothesStockBatch)
class ClothesStockBatchAdmin(admin.ModelAdmin):
    list_display = (
        'item',
        'size',
        'quantity',
        'date_income',
    )

    list_filter = (
        'item__type',    # фильтр по типу одежды (TOP/SHOES/OTHER)
        'item',          # фильтр по конкретному виду одежды
        'size',          # фильтр по размерам
        'date_income',
    )

    search_fields = (
        'item__name',
        'size',
    )

    ordering = ('item__name', 'size')

    # Для удобства редактирования
    fieldsets = (
        ("Информация о партии", {
            "fields": ("item", "size", "quantity", "date_income")
        }),
        ("Примечание", {
            "fields": ("note",),
            "classes": ("collapse",)
        }),
    )

    # Запрещаем удалять партии, если они участвуют в выдачах
    def has_delete_permission(self, request, obj=None):
        if obj:
            return not ClothesIssue.objects.filter(stock_batch=obj).exists()
        return True


#  Admin для ClothesItem (справочник одежды)
@admin.register(ClothesItem)
class ClothesItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'type')
    list_filter = ('type',)
    search_fields = ('name',)


# Admin для ClothesIssue (выдача одежды)

@admin.register(ClothesIssue)
class ClothesIssueAdmin(admin.ModelAdmin):
    list_display = (
        'employee',
        'item',
        'size',
        'quantity',
        'date_received',
        'date_expire',
        'stock_batch',
    )

    list_filter = (
        'item__type',
        'item',
        'size',
        'employee__department',
        'employee__service',
        'date_received',
    )

    search_fields = (
        'employee__last_name',
        'employee__first_name',
        'item__name',
        'size',
    )

    autocomplete_fields = ('employee', 'item', 'stock_batch')

    fieldsets = (
        ("Информация по выдаче", {
            "fields": (
                'employee',
                'item',
                'stock_batch',
                'quantity',
                'size',
            )
        }),
        ("Сроки", {
            "fields": ('date_received', 'operation_life_months', 'date_expire')
        }),
        ("Прочее", {
            "fields": ('order_point', 'note'),
            "classes": ('collapse',)
        })
    )

    # Запрещаем менять партию, если выдача уже существует
    def get_readonly_fields(self, request, obj=None):
        if obj:  # объект существует → режим редактирования
            return ('stock_batch',)
        return ()


