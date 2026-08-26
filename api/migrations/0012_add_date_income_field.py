from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_alter_employee_options_and_more'),
    ]

    operations = [
        # The field was already present in 0001_initial. Keeping this migration
        # as a no-op lets fresh MySQL databases pass through the old history.
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[],
        ),
    ]
