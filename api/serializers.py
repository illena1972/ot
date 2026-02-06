# serializers.py
from dateutil.relativedelta import relativedelta
from rest_framework import serializers
from django.utils import timezone
from .models import Department, Service, Position, Employee, ClothesItem, ClothesStockBatch, ClothesType, ClothesIssue, \
    ClothesIssueItem


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

    class Meta:
        model = ClothesStockBatch
        fields = "__all__"

    def validate(self, data):
        item = data.get("item")
        size = data.get("size")
        height = data.get("height")

        if not item:
            return data

        if item.type == ClothesType.TOP:
            if not size or not height:
                raise serializers.ValidationError({
                    "size": "Для верхней одежды требуется размер",
                    "height": "Для верхней одежды требуется рост",
                })

        if item.type == ClothesType.SHOES:
            if not size:
                raise serializers.ValidationError({
                    "size": "Для обуви требуется размер"
                })
            if height:
                raise serializers.ValidationError({
                    "height": "Для обуви рост не указывается"
                })

        if item.type == ClothesType.OTHER:
            if size or height:
                raise serializers.ValidationError(
                    "Для безразмерной одежды размер и рост не указываются"
                )

        return data



# выдача со склада
class ClothesIssueItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_type = serializers.CharField(source="item.type", read_only=True)

    class Meta:
        model = ClothesIssueItem
        fields = "__all__"

    def validate(self, data):
        item = data.get("item")
        size = data.get("size")
        height = data.get("height")

        if not item:
            return data

        if item.type == ClothesType.TOP:
            if not size or not height:
                raise serializers.ValidationError({
                    "size": "Для верхней одежды требуется размер",
                    "height": "Для верхней одежды требуется рост",
                })

        if item.type == ClothesType.SHOES:
            if not size:
                raise serializers.ValidationError({
                    "size": "Для обуви требуется размер"
                })
            if height:
                raise serializers.ValidationError({
                    "height": "Для обуви рост не указывается"
                })

        if item.type == ClothesType.OTHER:
            if size or height:
                raise serializers.ValidationError(
                    "Безразмерная одежда не имеет размера и роста"
                )

        return data


class ClothesIssueSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source="employee.__str__",
        read_only=True
    )

    items = ClothesIssueItemSerializer(many=True)

    class Meta:
        model = ClothesIssue
        fields = "__all__"

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        issue = ClothesIssue.objects.create(**validated_data)

        for item_data in items_data:
            serializer = ClothesIssueItemSerializer(
                data=item_data,
                context={"issue": issue}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return issue





