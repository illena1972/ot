# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, ServiceViewSet, PositionViewSet, EmployeeViewSet, ClothesItemViewSet, \
    ClothesIssueViewSet, ClothesStockBatchViewSet, StockAvailableView, StockViewSet
from django.urls import path
from api.views import stock_available

router = DefaultRouter()
router.register("departments", DepartmentViewSet)
router.register("services", ServiceViewSet)
router.register("positions", PositionViewSet)
router.register("employees", EmployeeViewSet)
router.register("clothes", ClothesItemViewSet)
#router.register("stocks", ClothesStockBatchViewSet)
router.register("issues", ClothesIssueViewSet)
router.register("stocks", StockViewSet)


urlpatterns = [
    # 🔹 кастомный endpoint
    path("stocks/available/", stock_available, name="stock-available"),

    # 🔹 все router endpoints
    *router.urls,
]

