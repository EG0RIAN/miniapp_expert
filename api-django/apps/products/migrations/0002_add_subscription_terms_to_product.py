# Generated migration for adding subscription_terms to Product

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
        ('documents', '0001_initial'),  # Зависит от первой миграции documents
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='subscription_terms',
            field=models.ForeignKey(
                blank=True,
                help_text='Условия подписки для данного продукта (если продукт является подпиской)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='products',
                to='documents.document',
                limit_choices_to={'document_type': 'subscription_terms', 'is_active': True},
            ),
        ),
    ]

