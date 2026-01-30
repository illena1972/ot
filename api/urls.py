# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, ServiceViewSet, PositionViewSet, EmployeeViewSet, ClothesItemViewSet, \
    ClothesIssueViewSet, ClothesStockBatchViewSet

router = DefaultRouter()
router.register("departments", DepartmentViewSet)
router.register("services", ServiceViewSet)
router.register("positions", PositionViewSet)
router.register("employees", EmployeeViewSet)
router.register("clothes", ClothesItemViewSet)
router.register(r"issues", ClothesIssueViewSet, basename="issue")
router.register("stocks", ClothesStockBatchViewSet)



urlpatterns = router.urls
