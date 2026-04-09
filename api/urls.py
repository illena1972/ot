# api/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path

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

    order_report,
    order_report_detail, order_report_export,
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

    # stock
    path(
        "stocks/available/",
        stock_available,
        name="stock-available"
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

    # router endpoints
    *router.urls,

]
