from django.db.models import Q

from .models import ClothesIssueItem


def build_employee_entitlements(employee, as_of):
    """Return the employee's PPE entitlement state on the requested date."""
    position = employee.position
    norm = position.issue_norm if position else None

    result = {
        "as_of": as_of,
        "employee": {
            "id": employee.pk,
            "name": str(employee),
            "position_id": position.pk if position else None,
            "position_name": position.name if position else "",
        },
        "norm": None,
        "items": [],
    }
    if not norm:
        return result

    result["norm"] = {"id": norm.pk, "name": norm.name}
    norm_items = list(norm.items.select_related("item").order_by("item__name"))
    item_ids = [row.item_id for row in norm_items]
    actual_items = (
        ClothesIssueItem.objects.filter(
            issue__employee=employee,
            issue__date_received__lte=as_of,
            item_id__in=item_ids,
        )
        .filter(Q(date_expire__gt=as_of) | Q(date_expire__isnull=True))
        .select_related("issue", "item")
        .order_by("date_expire", "pk")
    )

    actual_by_item = {}
    for actual in actual_items:
        actual_by_item.setdefault(actual.item_id, []).append(actual)

    for norm_item in norm_items:
        active_lots = actual_by_item.get(norm_item.item_id, [])
        active_quantity = sum(row.quantity for row in active_lots)
        missing_quantity = max(norm_item.quantity - active_quantity, 0)

        if missing_quantity:
            next_issue_date = as_of
            status = "missing"
        else:
            remaining_quantity = active_quantity
            next_issue_date = None
            for row in active_lots:
                if row.date_expire is None:
                    continue
                remaining_quantity -= row.quantity
                if remaining_quantity < norm_item.quantity:
                    next_issue_date = row.date_expire
                    break
            status = "provided"

        result["items"].append({
            "norm_item_id": norm_item.pk,
            "item": norm_item.item_id,
            "item_name": norm_item.item.name,
            "item_type": norm_item.item.type,
            "required_quantity": norm_item.quantity,
            "active_quantity": active_quantity,
            "missing_quantity": missing_quantity,
            "operation_life_months": norm_item.operation_life_months,
            "next_issue_date": next_issue_date,
            "status": status,
        })

    return result
