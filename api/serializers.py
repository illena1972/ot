# serializers.py
from django.db import transaction
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from datetime import date
from .models import Department, Service, Position, Employee, ClothesItem, ClothesType, ClothesIssue, \
    ClothesIssueItem, Stock
from django.db.models import F




import logging
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





# выдача со склада

class ClothesIssueItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClothesIssueItem
        fields = [
            "id",
            "issue",
            "item",
            "quantity",
            "size",
            "height",
            "operation_life_months",
            "note",
        ]
        read_only_fields = ["issue"]

    def update(self, instance, validated_data):
        from django.db import transaction
        from django.db.models import F
        from .models import Stock

        old_quantity = instance.quantity
        new_quantity = validated_data.get("quantity", instance.quantity)

        diff = new_quantity - old_quantity

        with transaction.atomic():
            stock = Stock.objects.select_for_update().get(
                item=instance.item,
                size=instance.size,
                height=instance.height
            )

            if diff > 0:
                if stock.quantity < diff:
                    raise serializers.ValidationError(
                        f"Недостаточно на складе '{instance.item}'. "
                        f"Доступно: {stock.quantity}, требуется дополнительно: {diff}"
                    )
                stock.quantity = F("quantity") - diff
                stock.save()

            elif diff < 0:
                stock.quantity = F("quantity") + abs(diff)
                stock.save()

            instance.quantity = new_quantity
            instance.operation_life_months = validated_data.get(
                "operation_life_months",
                instance.operation_life_months
            )
            instance.note = validated_data.get("note", instance.note)

            instance.save()

        return instance


class ClothesIssueSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source="employee.__str__",
        read_only=True
    )
    items = ClothesIssueItemSerializer(many=True)

    class Meta:
        model = ClothesIssue
        fields = [
            "id",
            "employee",
            "employee_name",
            "date_received",
            "note",
            "items",
        ]

    def create(self, validated_data):
        # забираем позиции и удаляем их из данных для создания самой выдачи
        items_data = validated_data.pop("items")

        # создаём сам документ выдачи
        issue = ClothesIssue.objects.create(**validated_data)

        # создаём позиции, привязывая их к документу
        for item_data in items_data:
            ClothesIssueItem.objects.create(
                issue=issue,
                item=item_data["item"],
                quantity=item_data["quantity"],
                size=item_data.get("size"),
                height=item_data.get("height"),
                operation_life_months=item_data.get("operation_life_months", 12),
                note=item_data.get("note", ""),
            )

        return issue

    def update(self, instance, validated_data):

        old_quantity = instance.quantity
        new_quantity = validated_data.get("quantity", instance.quantity)

        diff = new_quantity - old_quantity

        with transaction.atomic():
            stock = Stock.objects.select_for_update().get(
                item=instance.item,
                size=instance.size,
                height=instance.height
            )

            if diff > 0:
                if stock.quantity < diff:
                    raise serializers.ValidationError(
                        f"Недостаточно на складе '{instance.item}'. Доступно: {stock.quantity}, требуется дополнительно: {diff}"
                    )
                stock.quantity = F("quantity") - diff
                stock.save()

            elif diff < 0:
                stock.quantity = F("quantity") + abs(diff)
                stock.save()

            instance.quantity = new_quantity
            instance.operation_life_months = validated_data.get(
                "operation_life_months",
                instance.operation_life_months
            )
            instance.note = validated_data.get("note", instance.note)

            instance.save()

        return instance


# для проверки доступности при добавлении позиции
class StockAvailableSerializer(serializers.Serializer):
    item = serializers.IntegerField()
    size = serializers.IntegerField(required=False, allow_null=True)
    height = serializers.IntegerField(required=False, allow_null=True)

# отчет выдачи по сотруднику
class EmployeeIssueReportSerializer(serializers.ModelSerializer):
    item = serializers.IntegerField(source="item.id", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)
    date_received = serializers.DateField(source="issue.date_received", read_only=True)

    operation_life_months = serializers.IntegerField(read_only=True)
    note = serializers.CharField(read_only=True, allow_null=True)

    status = serializers.SerializerMethodField()

    class Meta:
        model = ClothesIssueItem
        fields = [
            "id",
            "item",
            "item_name",
            "quantity",
            "size",
            "height",
            "date_received",
            "date_expire",
            "operation_life_months",
            "note",
            "status",
        ]

    def get_status(self, obj):
        if not obj.date_expire:
            return "active"

        if obj.date_expire <= date.today():
            return "expired"

        return "active"


# склад
class StockSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_type = serializers.CharField(source="item.type", read_only=True)

    class Meta:
        model = Stock
        fields = [
            "id",
            "item",
            "item_name",
            "item_type",
            "size",
            "height",
            "quantity",
        ]

 # отчет для заказа (список)
class OrderReportSerializer(serializers.Serializer):

    item_id = serializers.IntegerField()
    item_name = serializers.CharField()

    item_type = serializers.CharField()

    size = serializers.CharField(allow_null=True)
    height = serializers.IntegerField(allow_null=True)

    total_quantity = serializers.IntegerField()

 # отчет для заказа (детализация)

class OrderReportDetailSerializer(serializers.ModelSerializer):

    employee_name = serializers.SerializerMethodField()

    date_received = serializers.DateField(
        source="issue.date_received"
    )

    def get_employee_name(self, obj):
        emp = obj.issue.employee
        return f"{emp.last_name} {emp.first_name} {emp.middle_name}"

    class Meta:
        model = ClothesIssueItem
        fields = [
            "id",
            "employee_name",
            "quantity",
            "size",
            "height",
            "date_received",
            "date_expire",
        ]