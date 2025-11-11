# Generated migration for removing unique constraint from document_type

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0001_initial'),  # Replace with the latest migration number
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='document_type',
            field=models.CharField(
                choices=[
                    ('privacy', 'Политика конфиденциальности'),
                    ('affiliate_terms', 'Условия партнерской программы'),
                    ('cabinet_terms', 'Условия использования личного кабинета'),
                    ('subscription_terms', 'Условия подписки'),
                    ('other', 'Другое'),
                ],
                max_length=50,
                verbose_name='Тип документа'
            ),
        ),
    ]

