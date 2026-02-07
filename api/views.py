# views.py
from django.db.models import Count
from rest_framework.viewsets import ModelViewSet
from .models import Department, Service, Position, Employee, ClothesItem, ClothesIssue, ClothesStockBatch, ClothesType
from .serializers import (
    DepartmentSerializer,
    ServiceSerializer,
    PositionSerializer,
    EmployeeSerializer,
    ClothesItemSerializer,
    ClothesIssueSerializer,
    ClothesStockBatchSerializer,
    StockAvailableSerializer,
)

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError


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


class StockAvailableView(APIView):
    """
    Возвращает доступное количество одежды на складе
    с учетом типа, размера и роста
    """

    def get(self, request):
        serializer = StockAvailableSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        item_id = serializer.validated_data["item"]
        size = serializer.validated_data.get("size")
        height = serializer.validated_data.get("height")

        try:
            item = ClothesItem.objects.get(pk=item_id)
        except ClothesItem.DoesNotExist:
            raise ValidationError({"item": "Одежда не найдена"})

        qs = ClothesStockBatch.objects.filter(item=item)

        # 👕 Верхняя одежда — размер + рост
        if item.type == ClothesType.TOP:
            if not size or not height:
                return Response({"available": 0})

            qs = qs.filter(size=size, height=height)

        # 👟 Обувь — только размер
        elif item.type == ClothesType.SHOES:
            if not size:
                return Response({"available": 0})

            qs = qs.filter(size=size)

        # 📦 Безразмерная
        elif item.type == ClothesType.OTHER:
            qs = qs.filter(size__isnull=True, height__isnull=True)

        total = qs.aggregate(total=Sum("quantity"))["total"] or 0

        return Response({"available": total})