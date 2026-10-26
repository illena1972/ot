from datetime import timedelta

from dateutil.relativedelta import relativedelta
from django.db import transaction

from .models import (
    ClothesIssue,
    ClothesIssueItem,
    ClothesItem,
    ClothesType,
    Department,
    Employee,
    IssueNorm,
    IssueNormItem,
    Position,
    Service,
    Stock,
)


class DemoDataAlreadyExists(Exception):
    pass


DEMO_MODELS = (
    Department,
    Service,
    Position,
    Employee,
    ClothesItem,
    IssueNorm,
    Stock,
    ClothesIssue,
)


def _has_operational_data(database_alias):
    return any(model.objects.using(database_alias).exists() for model in DEMO_MODELS)


def _clear_operational_data(database_alias):
    ClothesIssue.objects.using(database_alias).all().delete()
    Stock.objects.using(database_alias).all().delete()
    Employee.objects.using(database_alias).all().delete()
    Position.objects.using(database_alias).all().delete()
    IssueNorm.objects.using(database_alias).all().delete()
    ClothesItem.objects.using(database_alias).all().delete()
    Service.objects.using(database_alias).all().delete()
    Department.objects.using(database_alias).all().delete()


def seed_demo_database(database_alias, today, reset=False):
    """Fill an isolated organization database with presentation-safe data."""
    if _has_operational_data(database_alias) and not reset:
        raise DemoDataAlreadyExists(
            "В демонстрационной базе уже есть данные. Для пересоздания используйте --reset."
        )

    with transaction.atomic(using=database_alias):
        if reset:
            _clear_operational_data(database_alias)

        departments = {
            name: Department.objects.using(database_alias).create(name=name)
            for name in (
                "Административный отдел",
                "Медицинское отделение",
                "Хозяйственная служба",
                "Склад",
            )
        }
        services = {
            name: Service.objects.using(database_alias).create(name=name)
            for name in (
                "Медицинская служба",
                "Охрана труда",
                "Хозяйственное обеспечение",
            )
        }
        items = {
            name: ClothesItem.objects.using(database_alias).create(name=name, type=item_type)
            for name, item_type in (
                ("Ботинки кожаные с защитным подноском", ClothesType.SHOES),
                ("Жилет сигнальный", ClothesType.TOP),
                ("Каска защитная", ClothesType.OTHER),
                ("Костюм медицинский", ClothesType.TOP),
                ("Очки защитные", ClothesType.OTHER),
                ("Перчатки защитные", ClothesType.OTHER),
                ("Халат медицинский", ClothesType.TOP),
            )
        }

        norm_specs = {
            "Медицинский персонал": (
                ("Халат медицинский", 1, 12),
                ("Костюм медицинский", 1, 18),
                ("Перчатки защитные", 2, 12),
                ("Ботинки кожаные с защитным подноском", 1, 18),
            ),
            "Специалисты по охране труда": (
                ("Каска защитная", 1, 12),
                ("Очки защитные", 1, 12),
                ("Ботинки кожаные с защитным подноском", 1, 18),
            ),
            "Складской персонал": (
                ("Жилет сигнальный", 1, 12),
                ("Перчатки защитные", 4, 12),
                ("Ботинки кожаные с защитным подноском", 1, 18),
            ),
        }
        norms = {}
        for norm_name, rows in norm_specs.items():
            norm = IssueNorm.objects.using(database_alias).create(
                name=norm_name,
                description="Демонстрационная норма для презентации возможностей системы.",
            )
            norms[norm_name] = norm
            IssueNormItem.objects.using(database_alias).bulk_create([
                IssueNormItem(
                    norm=norm,
                    item=items[item_name],
                    quantity=quantity,
                    operation_life_months=months,
                )
                for item_name, quantity, months in rows
            ])

        positions = {
            name: Position.objects.using(database_alias).create(
                name=name,
                issue_norm=norms.get(norm_name),
            )
            for name, norm_name in (
                ("Врач-терапевт", "Медицинский персонал"),
                ("Медицинская сестра", "Медицинский персонал"),
                ("Специалист по охране труда", "Специалисты по охране труда"),
                ("Кладовщик", "Складской персонал"),
                ("Водитель", None),
            )
        }

        employee_specs = (
            ("Иванов", "Алексей", "Сергеевич", "M", "Административный отдел", "Охрана труда", "Специалист по охране труда", 50, 176, 42),
            ("Петрова", "Марина", "Викторовна", "F", "Медицинское отделение", "Медицинская служба", "Медицинская сестра", 46, 164, 39),
            ("Сидоров", "Николай", "Андреевич", "M", "Склад", "Хозяйственное обеспечение", "Кладовщик", 52, 182, 43),
            ("Орлова", "Елена", "Игоревна", "F", "Медицинское отделение", "Медицинская служба", "Врач-терапевт", 48, 170, 39),
            ("Кузнецов", "Павел", "Олегович", "M", "Хозяйственная служба", "Хозяйственное обеспечение", "Водитель", 52, 176, 43),
        )
        employees = {}
        for last_name, first_name, middle_name, sex, department, service, position, size, height, shoe_size in employee_specs:
            employee = Employee.objects.using(database_alias).create(
                last_name=last_name,
                first_name=first_name,
                middle_name=middle_name,
                sex=sex,
                department=departments[department],
                service=services[service],
                position=positions[position],
                clothes_size=size,
                height=height,
                shoe_size=shoe_size,
            )
            employees[last_name] = employee

        for item in items.values():
            if item.type == ClothesType.OTHER:
                Stock.objects.using(database_alias).create(item=item, quantity=50)
            elif item.type == ClothesType.SHOES:
                for size in (39, 42, 43):
                    Stock.objects.using(database_alias).create(
                        item=item,
                        size=size,
                        quantity=20,
                    )
            else:
                for size, height in ((46, 164), (48, 170), (50, 176), (52, 176), (52, 182)):
                    Stock.objects.using(database_alias).create(
                        item=item,
                        size=size,
                        height=height,
                        quantity=20,
                    )

        def issue(last_name, item_name, months, days_until_expiry, quantity=1):
            employee = employees[last_name]
            item = items[item_name]
            expiry_date = today + timedelta(days=days_until_expiry)
            received_date = expiry_date - relativedelta(months=months)
            document = ClothesIssue.objects.using(database_alias).create(
                employee=employee,
                date_received=received_date,
                note="Демонстрационная выдача",
            )
            size = None
            height = None
            if item.type == ClothesType.TOP:
                size = employee.clothes_size
                height = employee.height
            elif item.type == ClothesType.SHOES:
                size = employee.shoe_size
            ClothesIssueItem.objects.using(database_alias).create(
                issue=document,
                item=item,
                quantity=quantity,
                size=size,
                height=height,
                operation_life_months=months,
                note="Демонстрационные данные",
            )

        issue("Иванов", "Каска защитная", 12, -14)
        issue("Иванов", "Ботинки кожаные с защитным подноском", 18, 30)
        issue("Иванов", "Очки защитные", 12, 240)

        issue("Петрова", "Халат медицинский", 12, 45)
        issue("Петрова", "Костюм медицинский", 18, 240)

        issue("Орлова", "Халат медицинский", 12, 240)
        issue("Орлова", "Костюм медицинский", 18, 300)
        issue("Орлова", "Перчатки защитные", 12, 180, quantity=2)
        issue("Орлова", "Ботинки кожаные с защитным подноском", 18, 300)

        # This employee intentionally has no norm: actual issue expiry must
        # still appear on the dashboard.
        issue("Кузнецов", "Жилет сигнальный", 12, -5)

    return {
        "departments": len(departments),
        "services": len(services),
        "positions": len(positions),
        "employees": len(employees),
        "items": len(items),
        "norms": len(norms),
        "issues": ClothesIssue.objects.using(database_alias).count(),
    }
