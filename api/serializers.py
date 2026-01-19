# serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Department, Service, Position, Employee, ClothesItem, ClothesStockBatch, ClothesIssue, ClothesType


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "employee_count"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = "__all__"

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )
    service_name = serializers.CharField(
        source="service.name",
        read_only=True
    )
    position_name = serializers.CharField(
        source="position.name",
        read_only=True
    )

    class Meta:
        model = Employee
        fields = [
            "id",
            "last_name",
            "first_name",
            "middle_name",
            "sex",
            "department",
            "department_name",
            "service",
            "service_name",
            "position",
            "position_name",
            "clothes_size",
            "height",
            "shoe_size",
        ]

class ClothesItemSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = ClothesItem
        fields = ["id", "name", "type", "type_label"]

# поступление на склад
class ClothesStockBatchSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_type = serializers.CharField(source="item.type", read_only=True)

    date_income = serializers.DateField(
        required=False,
        allow_null=True
    )

    class Meta:
        model = ClothesStockBatch
        fields = "__all__"

    def to_internal_value(self, data):
        data = data.copy()

        # 👇 КЛЮЧЕВОЕ МЕСТО
        if data.get("date_income") == "":
            data["date_income"] = None

        return super().to_internal_value(data)

    def validate_date_income(self, value):
        if value is None:
            return timezone.now().date()
        return value

    def validate(self, data):
        item = data.get("item")
        size = data.get("size")

        if item.type in (ClothesType.TOP, ClothesType.SHOES) and not size:
            raise serializers.ValidationError({
                "size": "Укажите размер одежды!"
            })

        if item.type == ClothesType.OTHER and size:
            raise serializers.ValidationError({
                "size": "Для безразмерной одежды размер указывать нельзя"
            })

        return data
# выдача со склада

class ClothesIssueSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source="employee.__str__", read_only=True
    )
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = ClothesIssue
        fields = "__all__"