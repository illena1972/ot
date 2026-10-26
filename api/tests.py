from datetime import date

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError

from .entitlements import build_employee_entitlements
from .dashboard import build_dashboard_data
from .demo_data import DemoDataAlreadyExists, seed_demo_database
from .models import (
    ClothesIssue,
    ClothesIssueItem,
    ClothesItem,
    Employee,
    IssueNorm,
    IssueNormItem,
    Position,
    Stock,
)
from .serializers import ClothesIssueSerializer


class ClothesIssueSerializerTests(TestCase):
    def setUp(self):
        self.employee = Employee.objects.create(
            last_name="Тестов",
            first_name="Тест",
            sex="M",
        )

    def test_create_uses_total_quantity_from_duplicate_stock_rows(self):
        item = ClothesItem.objects.create(name="Каска", type="other")
        Stock.objects.create(item=item, quantity=2)
        Stock.objects.create(item=item, quantity=3)

        serializer = ClothesIssueSerializer(data={
            "employee": self.employee.pk,
            "date_received": "2026-09-03",
            "items": [{
                "item": item.pk,
                "quantity": 4,
                "operation_life_months": 12,
            }],
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        issue = serializer.save()

        self.assertEqual(issue.items.count(), 1)
        self.assertEqual(
            sum(Stock.objects.filter(item=item).values_list("quantity", flat=True)),
            1,
        )

    def test_create_rolls_back_issue_and_stock_when_one_item_fails(self):
        available_item = ClothesItem.objects.create(
            name="Перчатки", type="other"
        )
        unavailable_item = ClothesItem.objects.create(
            name="Очки", type="other"
        )
        Stock.objects.create(item=available_item, quantity=2)
        Stock.objects.create(item=unavailable_item, quantity=0)

        serializer = ClothesIssueSerializer(data={
            "employee": self.employee.pk,
            "date_received": "2026-09-03",
            "items": [
                {
                    "item": available_item.pk,
                    "quantity": 1,
                    "operation_life_months": 12,
                },
                {
                    "item": unavailable_item.pk,
                    "quantity": 1,
                    "operation_life_months": 12,
                },
            ],
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        with self.assertRaises(ValidationError):
            serializer.save()

        self.assertFalse(ClothesIssue.objects.exists())
        self.assertFalse(ClothesIssueItem.objects.exists())
        self.assertEqual(Stock.objects.get(item=available_item).quantity, 2)

    def test_norm_operation_life_is_used_for_new_issue(self):
        item = ClothesItem.objects.create(name="Халат", type="top")
        norm = IssueNorm.objects.create(name="Медицинский персонал")
        IssueNormItem.objects.create(
            norm=norm,
            item=item,
            quantity=1,
            operation_life_months=18,
        )
        position = Position.objects.create(name="Медсестра", issue_norm=norm)
        self.employee.position = position
        self.employee.save(update_fields=["position"])
        Stock.objects.create(item=item, size=48, height=164, quantity=1)

        serializer = ClothesIssueSerializer(data={
            "employee": self.employee.pk,
            "date_received": "2026-01-10",
            "items": [{
                "item": item.pk,
                "quantity": 1,
                "size": 48,
                "height": 164,
                "operation_life_months": 99,
            }],
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        issue = serializer.save()
        issue_item = issue.items.get()
        self.assertEqual(issue_item.operation_life_months, 18)
        self.assertEqual(issue_item.date_expire, date(2027, 7, 10))


class EmployeeEntitlementTests(TestCase):
    def setUp(self):
        self.item = ClothesItem.objects.create(name="Каска", type="other")
        self.norm = IssueNorm.objects.create(name="Производственная норма")
        IssueNormItem.objects.create(
            norm=self.norm,
            item=self.item,
            quantity=2,
            operation_life_months=12,
        )
        self.position = Position.objects.create(
            name="Мастер",
            issue_norm=self.norm,
        )
        self.employee = Employee.objects.create(
            last_name="Нормов",
            first_name="Николай",
            sex="M",
            position=self.position,
        )
        Stock.objects.create(item=self.item, quantity=2)

    def test_entitlements_show_shortage_when_nothing_was_issued(self):
        result = build_employee_entitlements(self.employee, date(2026, 6, 1))

        self.assertEqual(result["items"][0]["missing_quantity"], 2)
        self.assertEqual(result["items"][0]["next_issue_date"], date(2026, 6, 1))

    def test_entitlements_show_next_issue_date_from_actual_issue(self):
        issue = ClothesIssue.objects.create(
            employee=self.employee,
            date_received=date(2026, 1, 1),
        )
        ClothesIssueItem.objects.create(
            issue=issue,
            item=self.item,
            quantity=2,
            operation_life_months=12,
        )

        result = build_employee_entitlements(self.employee, date(2026, 6, 1))

        self.assertEqual(result["items"][0]["active_quantity"], 2)
        self.assertEqual(result["items"][0]["missing_quantity"], 0)
        self.assertEqual(result["items"][0]["next_issue_date"], date(2027, 1, 1))


class IssueItemDeletionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(
            get_user_model().objects.create_user(
                username="issue-delete-test",
                password="test-password",
            )
        )
        self.employee = Employee.objects.create(
            last_name="Списанов",
            first_name="Сергей",
            sex="M",
        )
        self.item = ClothesItem.objects.create(name="Защитные очки", type="other")
        self.stock = Stock.objects.create(item=self.item, quantity=4)

    def create_issue_item(self):
        issue = ClothesIssue.objects.create(
            employee=self.employee,
            date_received=date(2026, 9, 20),
        )
        return ClothesIssueItem.objects.create(
            issue=issue,
            item=self.item,
            quantity=1,
            operation_life_months=12,
        )

    def assert_stock_was_not_increased(self):
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.quantity, 3)

    def test_delete_issue_item_does_not_return_it_to_stock(self):
        issue_item = self.create_issue_item()

        response = self.client.delete(f"/api/issue-items/{issue_item.pk}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(ClothesIssueItem.objects.filter(pk=issue_item.pk).exists())
        self.assert_stock_was_not_increased()

    def test_write_off_issue_item_does_not_return_it_to_stock(self):
        issue_item = self.create_issue_item()

        response = self.client.delete(
            f"/api/issue-items/{issue_item.pk}/write-off/"
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(ClothesIssueItem.objects.filter(pk=issue_item.pk).exists())
        self.assert_stock_was_not_increased()


class DashboardTests(TestCase):
    def setUp(self):
        self.item_12 = ClothesItem.objects.create(name="Каска", type="other")
        self.item_18 = ClothesItem.objects.create(name="Куртка", type="other")
        self.norm = IssueNorm.objects.create(name="Норма дашборда")
        self.norm_item_12 = IssueNormItem.objects.create(
            norm=self.norm,
            item=self.item_12,
            quantity=1,
            operation_life_months=12,
        )
        self.norm_item_18 = IssueNormItem.objects.create(
            norm=self.norm,
            item=self.item_18,
            quantity=1,
            operation_life_months=18,
        )
        self.position = Position.objects.create(
            name="Специалист дашборда",
            issue_norm=self.norm,
        )
        self.employee = Employee.objects.create(
            last_name="Сроков",
            first_name="Иван",
            sex="M",
            position=self.position,
        )
        Stock.objects.create(item=self.item_12, quantity=2)
        Stock.objects.create(item=self.item_18, quantity=2)

    def issue_item(self, item, received, operation_life_months):
        issue = ClothesIssue.objects.create(
            employee=self.employee,
            date_received=received,
        )
        return ClothesIssueItem.objects.create(
            issue=issue,
            item=item,
            quantity=1,
            operation_life_months=operation_life_months,
        )

    def test_shows_twelve_month_item_on_warning_boundary(self):
        self.issue_item(self.item_12, date(2025, 12, 3), 12)
        self.issue_item(self.item_18, date(2026, 1, 1), 18)

        result = build_dashboard_data(60, date(2026, 10, 4))

        tasks = {row["item_name"]: row for row in result["tasks"]}
        self.assertEqual(tasks["Каска"]["status"], "due_soon")
        self.assertEqual(tasks["Каска"]["days_remaining"], 60)
        self.assertNotIn("Куртка", tasks)

    def test_separates_overdue_and_never_issued_items(self):
        self.issue_item(self.item_12, date(2025, 10, 1), 12)

        result = build_dashboard_data(60, date(2026, 10, 4))

        tasks = {row["item_name"]: row for row in result["tasks"]}
        self.assertEqual(tasks["Каска"]["status"], "overdue")
        self.assertEqual(tasks["Каска"]["quantity"], 1)
        self.assertEqual(tasks["Куртка"]["status"], "missing")
        self.assertEqual(result["counts"]["overdue"], 1)
        self.assertEqual(result["counts"]["missing"], 1)

    def test_item_outside_warning_period_is_not_a_task(self):
        self.issue_item(self.item_12, date(2026, 1, 1), 12)
        self.issue_item(self.item_18, date(2026, 1, 1), 18)

        result = build_dashboard_data(60, date(2026, 10, 4))

        self.assertEqual(result["tasks"], [])
        self.assertEqual(result["counts"]["total"], 0)

    def test_tasks_are_sorted_by_status_then_employee_name(self):
        second_employee = Employee.objects.create(
            last_name="Абрамов",
            first_name="Антон",
            sex="M",
            position=self.position,
        )
        second_issue = ClothesIssue.objects.create(
            employee=second_employee,
            date_received=date(2025, 12, 3),
        )
        ClothesIssueItem.objects.create(
            issue=second_issue,
            item=self.item_12,
            quantity=1,
            operation_life_months=12,
        )
        self.issue_item(self.item_12, date(2025, 10, 1), 12)

        result = build_dashboard_data(60, date(2026, 10, 4))

        ordered_pairs = [
            (row["status"], row["employee_name"], row["item_name"])
            for row in result["tasks"]
        ]
        self.assertEqual(ordered_pairs, [
            ("overdue", "Сроков Иван", "Каска"),
            ("due_soon", "Абрамов Антон", "Каска"),
            ("missing", "Абрамов Антон", "Куртка"),
            ("missing", "Сроков Иван", "Куртка"),
        ])

    def test_expiry_tasks_include_employee_without_norm(self):
        position_without_norm = Position.objects.create(name="Без нормы")
        employee_without_norm = Employee.objects.create(
            last_name="Свободнов",
            first_name="Семен",
            sex="M",
            position=position_without_norm,
        )
        issue = ClothesIssue.objects.create(
            employee=employee_without_norm,
            date_received=date(2025, 10, 4),
        )
        ClothesIssueItem.objects.create(
            issue=issue,
            item=self.item_12,
            quantity=1,
            operation_life_months=12,
        )

        result = build_dashboard_data(60, date(2026, 10, 4))

        employee_tasks = [
            row for row in result["tasks"]
            if row["employee_id"] == employee_without_norm.pk
        ]
        self.assertEqual(len(employee_tasks), 1)
        self.assertEqual(employee_tasks[0]["status"], "overdue")
        self.assertEqual(employee_tasks[0]["item_name"], "Каска")
        self.assertNotIn("missing", {row["status"] for row in employee_tasks})

    def test_summary_counts_unique_employees_not_ppe_rows(self):
        self.issue_item(self.item_12, date(2025, 10, 1), 12)
        self.issue_item(self.item_18, date(2025, 4, 1), 18)

        result = build_dashboard_data(60, date(2026, 10, 4))

        self.assertEqual(result["counts"]["overdue"], 1)
        self.assertEqual(result["task_count"], 2)


class DemoDataTests(TestCase):
    def test_seed_builds_safe_presentation_scenarios(self):
        today = date(2026, 10, 26)

        result = seed_demo_database("default", today=today)
        dashboard = build_dashboard_data(60, today)

        self.assertEqual(result["employees"], 5)
        self.assertEqual(result["norms"], 3)
        self.assertEqual(result["items"], 7)
        self.assertTrue({"overdue", "due_soon", "missing"}.issubset(
            {row["status"] for row in dashboard["tasks"]}
        ))

        driver = Employee.objects.get(last_name="Кузнецов")
        self.assertIsNone(driver.position.issue_norm)
        driver_rows = [
            row for row in dashboard["tasks"] if row["employee_id"] == driver.pk
        ]
        self.assertEqual(len(driver_rows), 1)
        self.assertEqual(driver_rows[0]["status"], "overdue")

    def test_seed_refuses_to_overwrite_existing_data_without_reset(self):
        today = date(2026, 10, 26)
        seed_demo_database("default", today=today)

        with self.assertRaises(DemoDataAlreadyExists):
            seed_demo_database("default", today=today)
