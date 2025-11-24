from django.db import migrations
from django.utils import timezone


def create_default_documents(apps, schema_editor):
    Document = apps.get_model('documents', 'Document')
    documents = [
        (
            'privacy',
            'Политика конфиденциальности',
            '<p>Политика конфиденциальности MiniAppExpert. Обновите текст в админке.</p>',
            'Политика конфиденциальности MiniAppExpert',
            'Политика конфиденциальности - MiniAppExpert',
            'Описание политики конфиденциальности MiniAppExpert',
        ),
        (
            'affiliate_terms',
            'Условия партнерской программы',
            '<p>Условия партнерской программы MiniAppExpert. Обновите текст в админке.</p>',
            'Условия партнерской программы MiniAppExpert',
            'Условия партнерской программы | MiniAppExpert',
            'Описание условий партнерской программы MiniAppExpert',
        ),
        (
            'cabinet_terms',
            'Условия использования личного кабинета',
            '<p>Условия использования личного кабинета MiniAppExpert. Обновите текст в админке.</p>',
            'Условия использования личного кабинета MiniAppExpert',
            'Условия использования личного кабинета | MiniAppExpert',
            'Описание условий использования личного кабинета MiniAppExpert',
        ),
        (
            'subscription_terms',
            'Условия подписки',
            '<p>Условия подписки MiniAppExpert. Обновите текст в админке.</p>',
            'Условия подписки MiniAppExpert',
            'Условия подписки | MiniAppExpert',
            'Описание условий подписки MiniAppExpert',
        ),
    ]

    for doc_type, title, content, content_text, meta_title, meta_description in documents:
        Document.objects.get_or_create(
            document_type=doc_type,
            defaults={
                'title': title,
                'content': content,
                'content_text': content_text,
                'meta_title': meta_title,
                'meta_description': meta_description,
                'slug': doc_type,
                'is_active': True,
                'is_published': True,
                'published_at': timezone.now(),
            }
        )


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_documents, migrations.RunPython.noop),
    ]

