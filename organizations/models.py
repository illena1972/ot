from django.core.validators import RegexValidator
from django.db import models


slug_validator = RegexValidator(
    regex=r"^[a-z0-9-]+$",
    message="Код организации может содержать только латинские строчные буквы, цифры и дефисы.",
)


class Organization(models.Model):
    """Central registry record for one customer organization."""

    name = models.CharField("Наименование", max_length=255, unique=True)
    slug = models.CharField(
        "Код организации",
        max_length=63,
        unique=True,
        validators=[slug_validator],
        help_text="Используется в адресе организации и имени ее базы данных.",
    )
    database_name = models.CharField("Имя рабочей базы", max_length=63, unique=True)
    is_active = models.BooleanField("Активна", default=True)
    created_at = models.DateTimeField("Создана", auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Организация"
        verbose_name_plural = "Организации"

    def __str__(self):
        return self.name


class OrganizationDomain(models.Model):
    """A hostname that identifies an organization before user login."""

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="domains",
        verbose_name="Организация",
    )
    domain = models.CharField("Домен", max_length=255, unique=True)
    is_primary = models.BooleanField("Основной", default=False)

    class Meta:
        ordering = ["domain"]
        verbose_name = "Домен организации"
        verbose_name_plural = "Домены организаций"

    def __str__(self):
        return self.domain
