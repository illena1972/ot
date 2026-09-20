from datetime import date

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError

from .entitlements import build_employee_entitlements
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
