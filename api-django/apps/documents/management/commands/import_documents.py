"""
Management команда для создания базовых документов
"""
from django.core.management.base import BaseCommand
from apps.documents.models import Document
from django.utils import timezone


class Command(BaseCommand):
    help = 'Импортирует существующие документы из HTML файлов'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Создание базовых документов...'))
        
        documents_to_create = [
            {
                'document_type': 'privacy',
                'title': 'Политика конфиденциальности',
                'content': '<p>Содержание политики конфиденциальности. Отредактируйте в админке.</p>',
                'content_text': 'Политика конфиденциальности MiniAppExpert',
                'meta_title': 'Политика конфиденциальности - MiniAppExpert',
                'meta_description': 'Политика конфиденциальности персональных данных MiniAppExpert',
            },
            {
                'document_type': 'affiliate_terms',
                'title': 'Условия партнерской программы',
                'content': '<p>Содержание условий партнерской программы. Отредактируйте в админке.</p>',
                'content_text': 'Условия партнерской программы MiniAppExpert',
                'meta_title': 'Условия партнерской программы | MiniAppExpert',
                'meta_description': 'Условия партнерской программы MiniAppExpert',
            },
            {
                'document_type': 'cabinet_terms',
                'title': 'Условия использования личного кабинета',
                'content': '<p>Содержание условий использования личного кабинета. Отредактируйте в админке.</p>',
                'content_text': 'Условия использования личного кабинета MiniAppExpert',
                'meta_title': 'Условия использования личного кабинета | MiniAppExpert',
                'meta_description': 'Условия использования личного кабинета MiniAppExpert',
            },
            {
                'document_type': 'subscription_terms',
                'title': 'Условия подписки',
                'content': '<p>Содержание условий подписки. Отредактируйте в админке.</p>',
                'content_text': 'Условия подписки MiniAppExpert',
                'meta_title': 'Условия подписки | MiniAppExpert',
                'meta_description': 'Условия подписки MiniAppExpert',
            },
        ]
        
        for doc_info in documents_to_create:
            try:
                document, created = Document.objects.get_or_create(
                    document_type=doc_info['document_type'],
                    defaults={
                        'title': doc_info['title'],
                        'content': doc_info['content'],
                        'content_text': doc_info['content_text'],
                        'meta_title': doc_info.get('meta_title', ''),
                        'meta_description': doc_info.get('meta_description', ''),
                        'is_active': True,
                        'is_published': True,
                        'published_at': timezone.now(),
                    }
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS(f'✓ Создан документ: {doc_info["title"]}'))
                else:
                    self.stdout.write(self.style.WARNING(f'○ Документ уже существует: {doc_info["title"]}'))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Ошибка при создании {doc_info["document_type"]}: {str(e)}'))
                import traceback
                traceback.print_exc()
        
        self.stdout.write(self.style.SUCCESS('Создание документов завершено!'))
        self.stdout.write(self.style.SUCCESS('Теперь отредактируйте документы в админке Django.'))

