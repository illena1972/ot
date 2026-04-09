from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_alter_employee_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='clothesstockbatch',
            name='date_income',
            field=models.DateField(
                default=django.utils.timezone.now,
                verbose_name='Дата поступления'
            ),
        ),
    ]