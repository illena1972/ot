from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0002_organizationuseractivity"),
    ]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="ppe_warning_days",
            field=models.PositiveSmallIntegerField(
                choices=[
                    (30, "30 дней"),
                    (60, "60 дней"),
                    (90, "90 дней"),
                    (180, "180 дней"),
                    (360, "360 дней"),
                ],
                default=60,
                verbose_name="Предупреждать об окончании срока СИЗ за (дней)",
            ),
        ),
    ]
