from django.db import models

from django.db import models
from django.utils import timezone
from datetime import timedelta


class Department(models.Model):
    """Структурное подразделение"""
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Service(models.Model):
    """Служба"""
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Position(models.Model):
    """Должность"""
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Employee(models.Model):
    """Сотрудники"""

    SEX_CHOICES = (
        ('M', 'Мужской'),
        ('F', 'Женский'),
    )

    last_name = models.CharField("Фамилия", max_length=100)
    first_name = models.CharField("Имя", max_length=100)
    middle_name = models.CharField("Отчество", max_length=100, blank=True, null=True)

    sex = models.CharField("Пол", max_length=1, choices=SEX_CHOICES)

    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, verbose_name="Подразделение"
    )
    service = models.ForeignKey(
        Service, on_delete=models.SET_NULL, null=True, verbose_name="Служба"
    )
    position = models.ForeignKey(
        Position, on_delete=models.SET_NULL, null=True, verbose_name="Должность"
    )

    clothes_size = models.CharField("Размер одежды", max_length=10, blank=True, null=True)
    height = models.IntegerField("Рост", blank=True, null=True)
    shoe_size = models.CharField("Размер обуви", max_length=10, blank=True, null=True)

    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.middle_name or ''}".strip()


class ClothesType(models.TextChoices):
    """Тип одежды по размеру"""
    TOP = "top", "Верхняя одежда (имеет размер)"
    SHOES = "shoes", "Обувь (имеет размер)"
    OTHER = "other", "Безразмерная экипировка"


class ClothesItem(models.Model):
    """Вид спецодежды"""
    name = models.CharField("Наименование", max_length=255)
    type = models.CharField("Тип одежды", max_length=20, choices=ClothesType.choices)

    def __str__(self):
        return self.name


class ClothesIssue(models.Model):
    """Выдача спецодежды сотруднику"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, verbose_name="Сотрудник")
    item = models.ForeignKey(ClothesItem, on_delete=models.CASCADE, verbose_name="Экипировка")

    quantity = models.PositiveIntegerField("Количество", default=1)

    size = models.CharField(
        "Размер",
        max_length=20,
        blank=True,
        null=True,
        help_text="Для верхней одежды и обуви"
    )

    operation_life_months = models.PositiveIntegerField("Срок эксплуатации (в месяцах)", default=12)

    order_point = models.CharField("Пункт приказа", max_length=255, blank=True, null=True)

    date_received = models.DateField("Дата получения", default=timezone.now)
    date_expire = models.DateField("Дата окончания срока носки", blank=True, null=True)

    note = models.TextField("Примечание", blank=True, null=True)

    def save(self, *args, **kwargs):
        # Автоматически рассчитываем дату окончания срока
        if self.date_received and self.operation_life_months and not self.date_expire:
            self.date_expire = self.date_received + timedelta(days=30 * self.operation_life_months)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item.name} → {self.employee}"

