# serializers.py
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DEFAULT_DB_ALIAS, router, transaction
from rest_framework import serializers
from datetime import date
from .models import Department, Service, Position, Employee, ClothesItem, ClothesType, ClothesIssue, \
    ClothesIssueItem, Stock, IssueNorm, IssueNormItem
from django.db.models import F




import logging
class CaseInsensitiveNameValidatorMixin:
    duplicate_name_message = "Запись с таким наименованием уже существует"

    def validate_name(self, value):
        value = value.strip()
        normalized_value = value.casefold()
        queryset = self.Meta.model.objects.all()

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        exists = any(
            item_name and item_name.strip().casefold() == normalized_value
            for item_name in queryset.values_list("name", flat=True)
        )

        if exists:
            raise serializers.ValidationError(self.duplicate_name_message)

        return value


class DepartmentSerializer(CaseInsensitiveNameValidatorMixin, serializers.ModelSerializer):
    duplicate_name_message = "Подразделение с таким наименованием уже существует"
    employee_count = serializers.IntegerField(read_only=True)
    name = serializers.CharField(validators=[])

    class Meta:
        model = Department
        fields = ["id", "name", "employee_count"]



class ServiceSerializer(CaseInsensitiveNameValidatorMixin, serializers.ModelSerializer):
    duplicate_name_message = "Служба с таким наименованием уже существует"
    name = serializers.CharField(validators=[])

    class Meta:
        model = Service
        fields = "__all__"




class PositionSerializer(CaseInsensitiveNameValidatorMixin, serializers.ModelSerializer):
    duplicate_name_message = "Должность с таким наименованием уже существует"
    name = serializers.CharField(validators=[])
    issue_norm_name = serializers.CharField(
        source="issue_norm.name",
        read_only=True,
    )

    class Meta:
        model = Position
        fields = ["id", "name", "issue_norm", "issue_norm_name"]



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

        last_name = data.get("last_name", "").strip()
        first_name = data.get("first_name", "").strip()
        middle_name = (data.get("middle_name") or "").strip()
        department = data.get("department")
        service = data.get("service")
        position = data.get("position")

        qs = Employee.objects.filter(
            department=department,
            service=service,
            position=position,
        )

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        exists = any(
            employee.last_name.strip().casefold() == last_name.casefold()
            and employee.first_name.strip().casefold() == first_name.casefold()
            and (employee.middle_name or "").strip().casefold() == middle_name.casefold()
            for employee in qs
        )

        if exists:
            raise serializers.ValidationError({
                "non_field_errors": [
                    "Сотрудник с такими ФИО, подразделением, службой и должностью уже существует"
                ]
            })

        data["last_name"] = last_name
        data["first_name"] = first_name
        data["middle_name"] = middle_name

        return data




class ClothesItemSerializer(CaseInsensitiveNameValidatorMixin, serializers.ModelSerializer):
    duplicate_name_message = "Одежда с таким наименованием уже существует"
    name = serializers.CharField(validators=[])
    type_label = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = ClothesItem
        fields = ["id", "name", "type", "type_label"]


class IssueNormItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_type = serializers.CharField(source="item.type", read_only=True)
    quantity = serializers.IntegerField(min_value=1)
    operation_life_months = serializers.IntegerField(min_value=1)

    class Meta:
        model = IssueNormItem
        fields = [
            "id",
            "item",
            "item_name",
            "item_type",
            "quantity",
            "operation_life_months",
        ]


class IssueNormSerializer(CaseInsensitiveNameValidatorMixin, serializers.ModelSerializer):
    duplicate_name_message = "Норма с таким наименованием уже существует"
    name = serializers.CharField(validators=[])
    items = IssueNormItemSerializer(many=True)
    position_ids = serializers.PrimaryKeyRelatedField(
        source="positions",
        queryset=Position.objects.all(),
        many=True,
        required=False,
    )
    position_names = serializers.SerializerMethodField()

    class Meta:
        model = IssueNorm
        fields = [
            "id",
            "name",
            "description",
            "items",
            "position_ids",
            "position_names",
        ]

    def get_position_names(self, obj):
        return list(obj.positions.order_by("name").values_list("name", flat=True))

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "Добавьте хотя бы одну позицию СИЗ"
            )

        item_ids = [row["item"].pk for row in value]
        if len(item_ids) != len(set(item_ids)):
            raise serializers.ValidationError(
                "Одно СИЗ нельзя добавить в норму несколько раз"
            )
        return value

    def _save_relations(self, norm, items, positions, database_alias):
        IssueNormItem.objects.using(database_alias).filter(norm=norm).delete()
        IssueNormItem.objects.using(database_alias).bulk_create([
            IssueNormItem(norm=norm, **item_data)
            for item_data in items
        ])
        norm.positions.set(positions)

    def create(self, validated_data):
        items = validated_data.pop("items")
        positions = validated_data.pop("positions", [])
        database_alias = router.db_for_write(IssueNorm)

        with transaction.atomic(using=database_alias):
            norm = IssueNorm.objects.using(database_alias).create(**validated_data)
            self._save_relations(norm, items, positions, database_alias)
        return norm

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        positions = validated_data.pop("positions", None)
        database_alias = instance._state.db or router.db_for_write(IssueNorm)

        with transaction.atomic(using=database_alias):
            for field, value in validated_data.items():
                setattr(instance, field, value)
            instance.save(using=database_alias)

            if items is not None:
                if positions is None:
                    positions = list(instance.positions.all())
                self._save_relations(instance, items, positions, database_alias)
            elif positions is not None:
                instance.positions.set(positions)
        return instance





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
        items_data = validated_data.pop("items")
        database_alias = validated_data["employee"]._state.db or DEFAULT_DB_ALIAS
        employee = validated_data["employee"]
        norm_items = {}
        if employee.position_id and employee.position.issue_norm_id:
            norm_items = {
                row.item_id: row.operation_life_months
                for row in IssueNormItem.objects.using(database_alias).filter(
                    norm_id=employee.position.issue_norm_id
                )
            }

        try:
            with transaction.atomic(using=database_alias):
                issue = ClothesIssue.objects.using(database_alias).create(
                    **validated_data
                )

                for item_data in items_data:
                    ClothesIssueItem.objects.using(database_alias).create(
                        issue=issue,
                        item=item_data["item"],
                        quantity=item_data["quantity"],
                        size=item_data.get("size"),
                        height=item_data.get("height"),
                        operation_life_months=norm_items.get(
                            item_data["item"].pk,
                            item_data.get("operation_life_months", 12),
                        ),
                        note=item_data.get("note", ""),
                    )
        except DjangoValidationError as error:
            raise serializers.ValidationError({"items": error.messages}) from error

        return issue

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
    stock_quantity = serializers.IntegerField()
    order_quantity = serializers.IntegerField()

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
