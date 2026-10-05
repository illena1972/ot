from collections import defaultdict
from datetime import timedelta

from django.db.models import Prefetch

from .models import ClothesIssueItem, Employee, IssueNormItem


STATUS_ORDER = {"overdue": 0, "due_soon": 1, "missing": 2}


def build_dashboard_data(warning_days, as_of):
    """Build expiry tasks for all issues and shortage tasks for norm employees."""
    warning_date = as_of + timedelta(days=warning_days)
    norm_item_queryset = IssueNormItem.objects.select_related("item")
    employees = list(
        Employee.objects.select_related("department", "position", "position__issue_norm")
        .prefetch_related(
            Prefetch("position__issue_norm__items", queryset=norm_item_queryset)
        )
        .order_by("last_name", "first_name", "middle_name")
    )

    actual_items = (
        ClothesIssueItem.objects.filter(
            issue__date_received__lte=as_of,
        )
        .select_related("issue", "item")
        .order_by("date_expire", "pk")
    )
    actual_by_employee_item = defaultdict(list)
    for actual in actual_items:
        actual_by_employee_item[(actual.issue.employee_id, actual.item_id)].append(
            actual
        )

    employee_by_id = {employee.pk: employee for employee in employees}
    tasks = []

    # Expiry control is based on every actual issue, including employees whose
    # positions do not have an issue norm.
    expiry_groups = defaultdict(int)
    for actual in actual_items:
        if actual.date_expire is None or actual.date_expire > warning_date:
            continue
        status = "overdue" if actual.date_expire <= as_of else "due_soon"
        key = (
            status,
            actual.issue.employee_id,
            actual.item_id,
            actual.date_expire,
        )
        expiry_groups[key] += actual.quantity

    for (status, employee_id, item_id, due_date), quantity in expiry_groups.items():
        employee = employee_by_id[employee_id]
        actual_rows = actual_by_employee_item[(employee_id, item_id)]
        item = next(row.item for row in actual_rows)
        tasks.append({
            "id": f"issued-{employee_id}-{item_id}-{due_date:%Y%m%d}",
            "status": status,
            "employee_id": employee_id,
            "employee_name": str(employee),
            "department_name": employee.department.name if employee.department else "",
            "position_name": employee.position.name if employee.position else "",
            "item_id": item_id,
            "item_name": item.name,
            "required_quantity": None,
            "active_quantity": None,
            "quantity": quantity,
            "due_date": due_date,
            "days_remaining": (due_date - as_of).days,
        })

    # A missing task only makes sense when a norm exists. When an expired
    # actual issue already represents the same shortage, the overdue row is
    # the actionable task and is not duplicated as "missing".
    for employee in employees:
        norm = employee.position.issue_norm if employee.position else None
        if norm is None:
            continue
        for norm_item in norm.items.all():
            actual_rows = actual_by_employee_item[(employee.pk, norm_item.item_id)]
            active_rows = [
                row
                for row in actual_rows
                if row.date_expire is None or row.date_expire > as_of
            ]
            expired_rows = [
                row
                for row in actual_rows
                if row.date_expire is not None and row.date_expire <= as_of
            ]
            active_quantity = sum(row.quantity for row in active_rows)
            missing_quantity = max(norm_item.quantity - active_quantity, 0)
            if not missing_quantity or expired_rows:
                continue

            tasks.append({
                "id": f"missing-{employee.pk}-{norm_item.pk}",
                "status": "missing",
                "employee_id": employee.pk,
                "employee_name": str(employee),
                "department_name": employee.department.name if employee.department else "",
                "position_name": employee.position.name,
                "item_id": norm_item.item_id,
                "item_name": norm_item.item.name,
                "required_quantity": norm_item.quantity,
                "active_quantity": active_quantity,
                "quantity": missing_quantity,
                "due_date": None,
                "days_remaining": None,
            })

    tasks.sort(key=lambda row: (
        STATUS_ORDER[row["status"]],
        row["employee_name"],
        row["item_name"],
    ))
    counts = {
        status: len({
            row["employee_id"] for row in tasks if row["status"] == status
        })
        for status in STATUS_ORDER
    }
    return {
        "as_of": as_of,
        "warning_days": warning_days,
        "warning_date": warning_date,
        "counts": {
            **counts,
            "total": len({row["employee_id"] for row in tasks}),
        },
        "task_count": len(tasks),
        "tasks": tasks,
    }
