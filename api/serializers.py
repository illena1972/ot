# serializers.py
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Department, Service, Position, Employee, ClothesItem, ClothesStockBatch, ClothesType, ClothesIssue, \
    ClothesIssueItem


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)

    name = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=Department.objects.all(),
                message="Подразделение с таким наименованием уже существует"
            )
        ]
    )

    class Meta:
        model = Department
        fields = ["id", "name", "employee_count"]



class ServiceSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=Service.objects.all(),
                message="Служба с таким наименованием уже существует"
            )
        ]
    )
    class Meta:
        model = Service
        fields = "__all__"




class PositionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=Position.objects.all(),
                message="Должность с таким наименованием уже существует"
            )
        ]
    )
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
        validators = []  # ← отключаем авто-unique validator

    def validate(self, data):

        last_name = data.get("last_name")
        first_name = data.get("first_name")
        middle_name = data.get("middle_name")
        department = data.get("department")
        service = data.get("service")
        position = data.get("position")

        qs = Employee.objects.filter(
            last_name=last_name,
            first_name=first_name,
            middle_name=middle_name,
            department=department,
            service=service,
            position=position,
        )

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError({
                "non_field_errors": [
                    "Сотрудник с такими ФИО, подразделением, службой и должностью уже существует"
                ]
            })

        return data




class ClothesItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=ClothesItem.objects.all(),
                message="Одежда с таким наименованием уже существует"
            )
        ]
    )

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

# для проверки доступности при добавлении позиции
class StockAvailableSerializer(serializers.Serializer):
    item = serializers.IntegerField()
    size = serializers.IntegerField(required=False, allow_null=True)
    height = serializers.IntegerField(required=False, allow_null=True)



