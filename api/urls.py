# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, ServiceViewSet, PositionViewSet, EmployeeViewSet

router = DefaultRouter()
router.register("departments", DepartmentViewSet)
router.register("services", ServiceViewSet)
router.register("positions", PositionViewSet)
router.register("employees", EmployeeViewSet)

urlpatterns = router.urls
