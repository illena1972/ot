from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError


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




# Модель: Партия на складе (ClothesStockBatch)
class ClothesStockBatch(models.Model):
    item = models.ForeignKey(
        ClothesItem,
        on_delete=models.PROTECT,
        verbose_name="Вид одежды"
    )

    size = models.CharField(
        "Размер",
        max_length=20,
        blank=True,
        null=True,
        help_text="Размер обязателен для верхней одежды и обуви"
    )

    quantity = models.PositiveIntegerField("Количество на складе")

    date_income = models.DateField("Дата поступления", default=timezone.now)

    note = models.TextField("Примечание", blank=True, null=True)

    def clean(self):
        # Одежда тип TOP или SHOES — размер обязателен
        if self.item.type in (ClothesType.TOP, ClothesType.SHOES) and not self.size:
            raise ValidationError("Для размерной одежды размер обязателен.")

        # Одежда тип OTHER — размер должен быть пустым
        if self.item.type == ClothesType.OTHER and self.size:
            raise ValidationError("Безразмерная одежда не должна иметь размер.")

    def __str__(self):
        s = f"{self.item.name}"
        if self.size:
            s += f" (размер {self.size})"
        return s















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

    stock_batch = models.ForeignKey(
        ClothesStockBatch,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Партия со склада"
    )

    note = models.TextField("Примечание", blank=True, null=True)

    def clean(self):
        if self.item.type in (ClothesType.TOP, ClothesType.SHOES) and not self.size:
            raise ValidationError("Для этого вида одежды необходимо указать размер.")

        if self.item.type == ClothesType.OTHER and self.size:
            raise ValidationError("Для безразмерной одежды не указывают размер.")

    def save(self, *args, **kwargs):
        # 1. Если размер не указан — подставляем по сотруднику
        if not self.size:
            if self.item.type == ClothesType.TOP:
                self.size = self.employee.clothes_size

            elif self.item.type == ClothesType.SHOES:
                self.size = self.employee.shoe_size

            # Для OTHER размер оставляем пустым

        # 2. Проверяем данные
        self.clean()

        # Для работы с остатками

        # 👇 Если партия не указана — автоматически ищем подходящую
        if not self.stock_batch:
            self.stock_batch = ClothesStockBatch.objects.filter(
                item=self.item,
                size=self.size
            ).order_by('date_income').first()  # FIFO (выдаём самые старые партии)

            if not self.stock_batch:
                raise ValidationError("На складе нет подходящей одежды для выдачи.")

        # 👇 Проверяем остаток в партии
        if is_new:
            if self.stock_batch.quantity < self.quantity:
                raise ValidationError("Недостаточно одежды на складе.")
        else:
            # Если запись обновляется – нужно проверить разницу
            previous = ClothesIssue.objects.get(pk=self.pk)
            delta = self.quantity - previous.quantity

            if delta > 0 and self.stock_batch.quantity < delta:
                raise ValidationError("Недостаточно одежды в выбранной партии.")

        # 👇 Вычитание из остатков (только при новой выдаче или увеличении количества)
        if is_new:
            self.stock_batch.quantity -= self.quantity
        else:
            delta = self.quantity - previous.quantity
            self.stock_batch.quantity -= max(delta, 0)

        self.stock_batch.save()

        # 3. Вычисляем дату окончания срока, если не задана
        if self.date_received and self.operation_life_months and not self.date_expire:
            self.date_expire = self.date_received + timedelta(days=30 * self.operation_life_months)

        # 4. Сохраняем объект
        super().save(*args, **kwargs)


