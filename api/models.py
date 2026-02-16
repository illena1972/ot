from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from dateutil.relativedelta import relativedelta
from datetime import timedelta
from django.db import transaction


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

    clothes_size = models.IntegerField("Размер одежды", blank=True, null=True)
    height = models.IntegerField("Рост", blank=True, null=True)
    shoe_size = models.IntegerField("Размер обуви", blank=True, null=True)

    class Meta:
        verbose_name = "Сотрудник"
        verbose_name_plural = "Сотрудники"

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "last_name",
                    "first_name",
                    "middle_name",
                    "department",
                    "service",
                    "position",
                ],
                name="unique_employee_full_identity",
                violation_error_message="Сотрудник с такими ФИО, подразделением, службой и должностью уже существует",
            )
        ]



    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.middle_name or ''}".strip()








class ClothesType(models.TextChoices):
    """Тип одежды по размеру"""
    TOP = "top", "Верхняя одежда"
    SHOES = "shoes", "Обувь"
    OTHER = "other", "Безразмерная экипировка"


class ClothesItem(models.Model):
    """Вид спецодежды"""
    name = models.CharField("Наименование", max_length=255, unique=True)
    type = models.CharField("Тип одежды", max_length=20, choices=ClothesType.choices)

    def __str__(self):
        return self.name




# Модель: Партия на складе (ClothesStockBatch)
class ClothesStockBatch(models.Model):
    item = models.ForeignKey(
        ClothesItem,
        on_delete=models.PROTECT,
        verbose_name="Вид одежды"
    )

    size = models.PositiveIntegerField(
        "Размер",
        blank=True,
        null=True,
        help_text="Размер обязателен для верхней одежды и обуви"
    )

    height = models.PositiveIntegerField(
        "Рост",
        blank=True,
        null=True,
        help_text="Указывается только для верхней одежды"
    )

    quantity = models.PositiveIntegerField("Количество на складе")

    date_income = models.DateField("Дата поступления", default=timezone.now)

    note = models.TextField("Примечание", blank=True, null=True)

    def clean(self):
        if self.item.type == ClothesType.TOP:
            if not self.size or not self.height:
                raise ValidationError(
                    "Для верхней одежды необходимо указать размер и рост."
                )

        if self.item.type == ClothesType.SHOES:
            if not self.size:
                raise ValidationError("Для обуви необходимо указать размер.")
            if self.height:
                raise ValidationError("Для обуви рост не указывается.")

        if self.item.type == ClothesType.OTHER:
            if self.size or self.height:
                raise ValidationError("Для безразмерной одежды размер и рост не указываются.")


# Модель «шапки документа» — Выдача
class ClothesIssue(models.Model):
    """Документ выдачи спецодежды"""

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        verbose_name="Сотрудник"
    )

    date_received = models.DateField(
        "Дата выдачи",
        default=timezone.now
    )

    note = models.TextField(
        "Общее примечание",
        blank=True,
        null=True
    )

    class Meta:
        ordering = ["-date_received"]

    def __str__(self):
        return f"{self.employee} — {self.date_received}"



# Модель «строк документа» — Позиция выдачи

class ClothesIssueItem(models.Model):
    """Позиция выдачи"""

    issue = models.ForeignKey(
        ClothesIssue,
        related_name="items",
        on_delete=models.CASCADE,
        verbose_name="Выдача"
    )

    item = models.ForeignKey(
        ClothesItem,
        on_delete=models.CASCADE,
        verbose_name="Наименование"
    )

    quantity = models.PositiveIntegerField("Количество")

    size = models.PositiveIntegerField(
        "Размер",
        blank=True,
        null=True
    )

    height = models.PositiveIntegerField(
        blank=True,
        null=True
    )

    operation_life_months = models.PositiveIntegerField(
        "Срок эксплуатации (мес.)",
        default=12
    )

    note = models.TextField(
        "Примечание",
        blank=True,
        null=True
    )

    date_expire = models.DateField(
        "Дата окончания носки",
        blank=True,
        null=True
    )

    def clean(self):
        if self.item.type == ClothesType.TOP:
            if not self.size or not self.height:
                raise ValidationError(
                    "Для верхней одежды необходимо указать размер и рост."
                )

        if self.item.type == ClothesType.SHOES:
            if not self.size:
                raise ValidationError("Для обуви требуется размер.")
            if self.height:
                raise ValidationError("Для обуви рост не указывается.")

        if self.item.type == ClothesType.OTHER:
            if self.size or self.height:
                raise ValidationError("Безразмерная одежда не имеет размеров.")



    def save(self, *args, **kwargs):
        self.clean()

        if self.issue.date_received and self.operation_life_months:
            self.date_expire = self.issue.date_received + relativedelta(
                months=self.operation_life_months
            )

        super().save(*args, **kwargs)











