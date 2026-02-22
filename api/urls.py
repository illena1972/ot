# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, ServiceViewSet, PositionViewSet, EmployeeViewSet, ClothesItemViewSet, \
    ClothesIssueViewSet, StockViewSet, ClothesIssueItemViewSet
from django.urls import path
from api.views import stock_available

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
    # 🔹 кастомный endpoint
    path("stocks/available/", stock_available, name="stock-available"),

    # 🔹 все router endpoints
    *router.urls,
]

