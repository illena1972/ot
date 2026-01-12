# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, ServiceViewSet, PositionViewSet, EmployeeViewSet, ClothesItemViewSet

router = DefaultRouter()
router.register("departments", DepartmentViewSet)
router.register("services", ServiceViewSet)
router.register("positions", PositionViewSet)
router.register("employees", EmployeeViewSet)
router.register("clothes", ClothesItemViewSet)


urlpatterns = router.urls
