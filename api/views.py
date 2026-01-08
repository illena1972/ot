# views.py
from rest_framework.viewsets import ModelViewSet
from .models import Department, Service, Position, Employee
from .serializers import (
    DepartmentSerializer,
    ServiceSerializer,
    PositionSerializer,
    EmployeeSerializer,
)


class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.order_by("name")
    serializer_class = DepartmentSerializer


class ServiceViewSet(ModelViewSet):
    queryset = Service.objects.order_by("name")
    serializer_class = ServiceSerializer


class PositionViewSet(ModelViewSet):
    queryset = Position.objects.order_by("name")
    serializer_class = PositionSerializer

class EmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.order_by(
        "last_name",
        "first_name",
        "middle_name"
    )
    serializer_class = EmployeeSerializer