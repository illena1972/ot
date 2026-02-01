# views.py
from django.db.models import Count
from rest_framework.viewsets import ModelViewSet
from .models import Department, Service, Position, Employee, ClothesItem, ClothesIssue, ClothesStockBatch
from .serializers import (
    DepartmentSerializer,
    ServiceSerializer,
    PositionSerializer,
    EmployeeSerializer,
    ClothesItemSerializer,
    ClothesIssueSerializer,
    ClothesStockBatchSerializer,
)

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

class EmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.select_related(
        "department", "service", "position"
    ).order_by("last_name", "first_name")

    serializer_class = EmployeeSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter]

    # фильтр по подразделению
    filterset_fields = ["department"]

    # 🔍 поиск ТОЛЬКО по фамилии
    search_fields = ["last_name"]


class ClothesItemViewSet(ModelViewSet):
    queryset = ClothesItem.objects.order_by("name")
    serializer_class = ClothesItemSerializer



class ClothesStockBatchViewSet(ModelViewSet):
    queryset = ClothesStockBatch.objects.select_related("item").order_by("-date_income")
    serializer_class = ClothesStockBatchSerializer


class ClothesIssueViewSet(ModelViewSet):
    queryset = ClothesIssue.objects.select_related(
        "employee"
    ).prefetch_related(
        "items",
        "items__item"
    )

    serializer_class = ClothesIssueSerializer
