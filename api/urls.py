# api/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from organizations.views import current_organization, current_user, login_user, logout_user

from .views import (
    DepartmentViewSet,
    ServiceViewSet,
    PositionViewSet,
    EmployeeViewSet,
    ClothesItemViewSet,
    ClothesIssueViewSet,
    StockViewSet,
    ClothesIssueItemViewSet,

    stock_available,
    write_off_issue_item,

    order_report,
    order_report_detail, order_report_export, employee_card_export,
)

router = DefaultRouter()

router.register("departments", DepartmentViewSet)
router.register("services", ServiceViewSet)
router.register("positions", PositionViewSet)
router.register("employees", EmployeeViewSet)
router.register("clothes", ClothesItemViewSet)
router.register("issues", ClothesIssueViewSet)
router.register("stocks", StockViewSet)
router.register("issue-items", ClothesIssueItemViewSet)


urlpatterns = [

    path(
        "organization/current/",
        current_organization,
        name="current-organization",
    ),
    path("auth/login/", login_user, name="login"),
    path("auth/logout/", logout_user, name="logout"),
    path("auth/me/", current_user, name="current-user"),

    # stock
    path(
        "stocks/available/",
        stock_available,
        name="stock-available"
    ),

    path(
        "issue-items/<int:pk>/write-off/",
        write_off_issue_item,
        name="issue-item-write-off"
    ),

    # report for order
    path(
        "reports/order/",
        order_report,
        name="order-report"
    ),

    path(
        "reports/order/detail/",
        order_report_detail,
        name="order-report-detail"
    ),

    path(
        "reports/order/export/",
        order_report_export
    ),

    path(
        "reports/employee-card/export/",
        employee_card_export,
        name="employee-card-export",
    ),

    # router endpoints
    *router.urls,

]
