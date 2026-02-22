# views.py
from django.db.models import Count
from rest_framework.viewsets import ModelViewSet
from .models import Department, Service, Position, Employee, ClothesItem, ClothesIssue, ClothesType, \
    Stock, ClothesIssueItem
from .serializers import (
    DepartmentSerializer,
    ServiceSerializer,
    PositionSerializer,
    ClothesItemSerializer,
    ClothesIssueSerializer,
    StockAvailableSerializer,
    EmployeeIssueReportSerializer,
    StockSerializer,
    EmployeeSerializer,
    ClothesIssueItemSerializer,
)

from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.db.models import F
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter


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