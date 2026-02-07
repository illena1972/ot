# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, ServiceViewSet, PositionViewSet, EmployeeViewSet, ClothesItemViewSet, \
    ClothesIssueViewSet, ClothesStockBatchViewSet, StockAvailableView
from django.urls import path

router = DefaultRouter()
router.register("departments", DepartmentViewSet)
router.register("services", ServiceViewSet)
router.register("positions", PositionViewSet)
router.register("employees", EmployeeViewSet)
router.register("clothes", ClothesItemViewSet)
router.register("stocks", ClothesStockBatchViewSet)
router.register("clothes-issues", ClothesIssueViewSet)

urlpatterns = [
    # 🔹 кастомный endpoint
    path("stocks/available/", StockAvailableView.as_view()),

    # 🔹 все router endpoints
    *router.urls,
]