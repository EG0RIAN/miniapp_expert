# Generated migration for adding has_seen_documents field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='has_seen_documents',
            field=models.BooleanField(
                default=False,
                verbose_name='Пользователь видел модалку с документами при первом входе'
            ),
        ),
    ]
