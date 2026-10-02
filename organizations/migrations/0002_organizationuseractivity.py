import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrganizationUserActivity",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("username", models.CharField(max_length=150, verbose_name="Пользователь")),
                ("activity_date", models.DateField(verbose_name="Дата активности")),
                ("first_seen_at", models.DateTimeField(verbose_name="Первая активность")),
                ("last_seen_at", models.DateTimeField(verbose_name="Последняя активность")),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="user_activity_days",
                        to="organizations.organization",
                        verbose_name="Организация",
                    ),
                ),
            ],
            options={
                "verbose_name": "Активность пользователя",
                "verbose_name_plural": "Активность пользователей",
                "ordering": ["-activity_date", "username"],
            },
        ),
        migrations.AddConstraint(
            model_name="organizationuseractivity",
            constraint=models.UniqueConstraint(
                fields=("organization", "username", "activity_date"),
                name="unique_organization_user_activity_day",
            ),
        ),
        migrations.AddIndex(
            model_name="organizationuseractivity",
            index=models.Index(
                fields=["organization", "activity_date"],
                name="org_activity_date_idx",
            ),
        ),
    ]
