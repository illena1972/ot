# views.py
from django.db.models import Count
from rest_framework.viewsets import ModelViewSet
from .models import Department, Service, Position, Employee, ClothesItem, ClothesIssue,  \
    Stock, ClothesIssueItem
from .serializers import (
    DepartmentSerializer,
    ServiceSerializer,
    PositionSerializer,
    ClothesItemSerializer,
    ClothesIssueSerializer,
    EmployeeIssueReportSerializer,
    StockSerializer,
    EmployeeSerializer,
    ClothesIssueItemSerializer,
    OrderReportSerializer,
    OrderReportDetailSerializer,
)

from django.db.models import Sum
from django.db.models import F
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from datetime import timedelta
from django.utils import timezone

import openpyxl
from django.http import HttpResponse
from openpyxl import Workbook






class DepartmentViewSet(ModelViewSet):
    queryset = (
        Department.objects
        .annotate(employee_count=Count("employee"))
        .order_by("name")
    )
    serializer_class = DepartmentSerializer


class ServiceViewSet(ModelViewSet):
    queryset = Service.objects.order_by("name")
    serializer_class = ServiceSerializer


class PositionViewSet(ModelViewSet):
    queryset = Position.objects.order_by("name")
    serializer_class = PositionSerializer




# GET /api/employees/{id}/
class EmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.select_related(
        "department",
        "service",
        "position"
    ).order_by("last_name", "first_name")

    serializer_class = EmployeeSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter]

    filterset_fields = ["department"]

    search_fields = [
        "last_name",
        "first_name",
        "middle_name",
    ]

    # -------------------------
    # ОТЧЕТ ПО СОТРУДНИКУ
    # GET /api/employees/{id}/report/
    # -------------------------
    @action(detail=True, methods=["get"])
    def report(self, request, pk=None):
        employee = self.get_object()

        items = ClothesIssueItem.objects.select_related(
            "issue",
            "item"
        ).filter(
            issue__employee=employee
        ).order_by("-issue__date_received")

        serializer = EmployeeIssueReportSerializer(items, many=True)

        return Response({
            "employee": {
                "id": employee.id,
                "last_name": employee.last_name,
                "first_name": employee.first_name,
                "middle_name": employee.middle_name,
                "department": employee.department.name if employee.department else "",
                "service": employee.service.name if employee.service else "",
                "position": employee.position.name if employee.position else "",
            },
            "items": serializer.data
        })


class ClothesItemViewSet(ModelViewSet):
    queryset = ClothesItem.objects.order_by("name")
    serializer_class = ClothesItemSerializer


class ClothesIssueViewSet(ModelViewSet):
    queryset = ClothesIssue.objects.select_related("employee").prefetch_related(
        "items", "items__stock", "items__stock__item"
    )
    serializer_class = ClothesIssueSerializer





class StockViewSet(ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer

    def create(self, request, *args, **kwargs):
        item = request.data.get("item")
        size = request.data.get("size")
        height = request.data.get("height")
        quantity = int(request.data.get("quantity", 0))

        stock, created = Stock.objects.get_or_create(
            item_id=item,
            size=size,
            height=height,
            defaults={
                "quantity": quantity,
            }
        )

        if not created:
            stock.quantity = F("quantity") + quantity
            stock.save()
            stock.refresh_from_db()

        serializer = self.get_serializer(stock)
        return Response(serializer.data)


@api_view(["GET"])
def stock_available(request):
    """
    Возвращает количество доступных единиц одежды на складе
    с учётом item, size и height.
    """
    item = request.GET.get("item")
    size = request.GET.get("size")
    height = request.GET.get("height")

    qs = Stock.objects.filter(item_id=item)

    if size:
        qs = qs.filter(size=size)
    if height:
        qs = qs.filter(height=height)

    total = qs.aggregate(quantity_total=Sum("quantity"))["quantity_total"] or 0
    return Response({"available": total})


class ClothesIssueItemViewSet(ModelViewSet):
    queryset = ClothesIssueItem.objects.all()
    serializer_class = ClothesIssueItemSerializer

    def destroy(self, request, *args, **kwargs):
        from django.db import transaction
        from django.db.models import F

        instance = self.get_object()

        with transaction.atomic():
            stock, _ = Stock.objects.select_for_update().get_or_create(
                item=instance.item,
                size=instance.size,
                height=instance.height,
                defaults={"quantity": 0},
            )

            stock.quantity = F("quantity") + instance.quantity
            stock.save()

            instance.delete()

        return Response(status=204)




# отчет для заказа

@api_view(["GET"])
def order_report(request):

    limit_date = timezone.now().date() + timedelta(days=180)

    queryset = ClothesIssueItem.objects.filter(
        date_expire__isnull=False,
        date_expire__lte=limit_date
    )

    # ✅ фильтр по типу (ИСПРАВЛЕНО)
    item_type = request.GET.get("type")

    if item_type and item_type != "all":
        queryset = queryset.filter(
            item__type=item_type   # ← исправлено
        )

    data = queryset.values(

        "item_id",
        "item__name",
        "item__type",   # ← исправлено
        "size",
        "height",

    ).annotate(

        total_quantity=Sum("quantity")

    ).order_by("item__name")

    # ✅ формирование результата (ИСПРАВЛЕНО)
    result = [

        {

            "item_id": row["item_id"],
            "item_name": row["item__name"],
            "item_type": row["item__type"],   # ← исправлено
            "size": row["size"],
            "height": row["height"],
            "total_quantity": row["total_quantity"],

        }

        for row in data

    ]

    serializer = OrderReportSerializer(result, many=True)

    return Response(serializer.data)

# детализация отчета для заказа

@api_view(["GET"])
def order_report_detail(request):

    item_id = request.GET.get("item_id")
    size = request.GET.get("size")
    height = request.GET.get("height")

    limit_date = timezone.now().date() + timedelta(days=180)

    queryset = ClothesIssueItem.objects.filter(
        item_id=item_id,
        date_expire__isnull=False,
        date_expire__lte=limit_date
    ).select_related(
        "issue",
        "issue__employee",
        "item"
    )

    # ✅ фильтр size
    if size not in [None, "", "null"]:
        queryset = queryset.filter(size=size)
    else:
        queryset = queryset.filter(size__isnull=True)

    # ✅ фильтр height
    if height not in [None, "", "null"]:
        queryset = queryset.filter(height=height)
    else:
        queryset = queryset.filter(height__isnull=True)

    # ✅ сортировка
    queryset = queryset.order_by(
        "date_expire",
        "issue__employee__last_name"
    )

    serializer = OrderReportDetailSerializer(
        queryset,
        many=True
    )

    return Response(serializer.data)




@api_view(["GET"])
def order_report_export(request):
    """
    Экспорт отчёта для заказа спецодежды в Excel.
    Берём все выданные позиции с оставшимся сроком <= 6 месяцев,
    группируем по item/size/height и суммируем количество.
    Можно фильтровать по типу одежды через GET-параметр type.
    """

    # предел для 6 месяцев
    limit_date = timezone.now().date() + timezone.timedelta(days=180)

    # базовый queryset
    queryset = ClothesIssueItem.objects.filter(date_expire__lte=limit_date)

    # фильтр по типу одежды
    item_type = request.GET.get("type")
    if item_type and item_type != "all":
        queryset = queryset.filter(item__type=item_type)

    # группировка по item/size/height
    data = queryset.values(
        "item_id",
        "item__name",
        #"item__type",
        "size",
        "height",
    ).annotate(
        total_quantity=Sum("quantity")
    ).order_by("item__name")

    # создаём Excel
    wb = Workbook()
    ws = wb.active
    ws.title = "Отчёт для заказа"

    # шапка
    #ws.append(["Наименование", "Тип", "Размер", "Рост", "Количество"])
    ws.append(["Наименование", "Размер", "Рост", "Количество"])

    for row in data:
        ws.append([
            row["item__name"],       # Наименование
            #row["item__type"],       # Тип одежды
            row["size"] or "",       # Размер
            row["height"] or "",     # Рост
            row["total_quantity"],   # Количество
        ])

    # формируем ответ
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = 'attachment; filename="order_report.xlsx"'
    wb.save(response)

    return response