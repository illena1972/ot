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
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class ServiceViewSet(ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


class PositionViewSet(ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer

class EmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer