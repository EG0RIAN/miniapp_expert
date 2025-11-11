"""
Management команда для миграции документов из HTML файлов в базу данных
"""
from django.core.management.base import BaseCommand
from apps.documents.models import Document
from django.utils import timezone
import os
from pathlib import Path
import re


class Command(BaseCommand):
    help = 'Мигрирует документы из HTML файлов в базу данных'

    def add_arguments(self, parser):
        parser.add_argument(
            '--html-dir',
            type=str,
            default='../../site',
            help='Путь к директории с HTML файлами документов',
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='Обновить существующие документы',
        )

    def extract_content_from_html(self, html_content):
        """Извлекает контент из HTML между тегами"""
        # Пробуем разные паттерны для извлечения контента
        patterns = [
            # Для privacy.html: контент внутри <div class="bg-white rounded-2xl"> внутри <main>
            r'<main[^>]*>.*?<div class="bg-white rounded-2xl[^>]*>(.*?)</div>\s*</main>',
            # Для других файлов: контент внутри <div class="bg-white rounded-2xl"> или <div class="prose">
            r'<div class="bg-white rounded-2xl[^>]*>.*?<div class="prose[^>]*>(.*?)</div>\s*</div>',
            r'<div class="bg-white rounded-2xl[^>]*>(.*?)</div>\s*(?=<footer|</body|</div>\s*</main)',
            # Альтернативный паттерн для subscription-terms.html
            r'<div class="max-w-4xl[^>]*>.*?<div class="bg-white[^>]*>(.*?)</div>\s*(?=<footer|</body)',
            # Общий паттерн для main
            r'<main[^>]*>(.*?)</main>',
        ]
        
        content = None
        for pattern in patterns:
            match = re.search(pattern, html_content, re.DOTALL | re.IGNORECASE)
            if match:
                content = match.group(1)
                break
        
        if not content:
            return None
        
        # Удаляем заголовок h1, если есть
        content = re.sub(r'<h1[^>]*>.*?</h1>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Удаляем дату последнего обновления (в параграфе с классом text-gray-600 или без)
        content = re.sub(r'<p[^>]*class="[^"]*text-gray-600[^"]*"[^>]*>.*?Дата последнего обновления.*?</p>', '', content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<p[^>]*class="[^"]*text-gray-600[^"]*"[^>]*>.*?Последнее обновление.*?</p>', '', content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<p[^>]*>.*?<strong>Дата последнего обновления:</strong>.*?</p>', '', content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<p[^>]*>.*?Последнее обновление:.*?</p>', '', content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<p[^>]*>.*?Дата последнего обновления:.*?</p>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Удаляем навигационные ссылки и кнопки "На главную", "Вернуться"
        content = re.sub(r'<a[^>]*>.*?(На главную|Вернуться в личный кабинет|Вернуться на главную|Вернуться).*?</a>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Удаляем кнопку "Закрыть окно" и дату обновления внизу
        content = re.sub(r'<button[^>]*>.*?Закрыть окно.*?</button>', '', content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<p[^>]*>.*?Дата последнего обновления:.*?</p>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Удаляем footer внутри контента, если есть
        content = re.sub(r'<footer[^>]*>.*?</footer>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Удаляем div с навигацией "Back to cabinet"
        content = re.sub(r'<div[^>]*>.*?Вернуться в личный кабинет.*?</div>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Очищаем от лишних пробелов и переносов строк
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
        content = content.strip()
        
        return content

    def extract_text_content(self, html_content):
        """Извлекает текстовый контент из HTML для поиска"""
        # Удаляем все HTML теги
        text = re.sub(r'<[^>]+>', ' ', html_content)
        # Удаляем лишние пробелы
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def handle(self, *args, **options):
        html_dir = options.get('html_dir')
        update = options.get('update', False)
        
        # Определяем путь к директории с HTML файлами
        # Команда находится в: api-django/apps/documents/management/commands/
        # HTML файлы находятся в: site/
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        if html_dir.startswith('../../'):
            # Относительный путь от api-django к site
            html_dir_path = base_dir / html_dir
        elif html_dir.startswith('../'):
            html_dir_path = base_dir / html_dir
        elif Path(html_dir).is_absolute():
            html_dir_path = Path(html_dir)
        else:
            # Пробуем найти site/ относительно api-django
            html_dir_path = base_dir / 'site'
        
        self.stdout.write(self.style.SUCCESS(f'Поиск HTML файлов в: {html_dir_path}'))
        
        # Маппинг файлов к типам документов
        documents_map = {
            'privacy.html': {
                'document_type': 'privacy',
                'title': 'Политика конфиденциальности',
                'meta_title': 'Политика конфиденциальности - MiniAppExpert',
                'meta_description': 'Политика конфиденциальности персональных данных MiniAppExpert',
            },
            'affiliate-terms.html': {
                'document_type': 'affiliate_terms',
                'title': 'Условия партнерской программы',
                'meta_title': 'Условия партнерской программы | MiniAppExpert',
                'meta_description': 'Условия партнерской программы MiniAppExpert',
            },
            'cabinet-terms.html': {
                'document_type': 'cabinet_terms',
                'title': 'Условия использования личного кабинета',
                'meta_title': 'Условия использования личного кабинета | MiniAppExpert',
                'meta_description': 'Условия использования личного кабинета MiniAppExpert',
            },
            'subscription-terms.html': {
                'document_type': 'subscription_terms',
                'title': 'Условия подписки',
                'meta_title': 'Условия подписки | MiniAppExpert',
                'meta_description': 'Условия подписки MiniAppExpert',
            },
        }
        
        for filename, doc_info in documents_map.items():
            file_path = html_dir_path / filename
            
            if not file_path.exists():
                self.stdout.write(self.style.WARNING(f'Файл не найден: {file_path}'))
                continue
            
            try:
                # Читаем HTML файл
                with open(file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Извлекаем контент
                content = self.extract_content_from_html(html_content)
                if not content:
                    self.stdout.write(self.style.WARNING(f'Не удалось извлечь контент из {filename}'))
                    continue
                
                # Извлекаем текстовый контент
                content_text = self.extract_text_content(content)
                
                # Получаем или создаем документ
                try:
                    document = Document.objects.get(document_type=doc_info['document_type'])
                    # Документ существует, обновляем
                    if update:
                        document.content = content
                        document.content_text = content_text
                        document.meta_title = doc_info.get('meta_title', document.meta_title)
                        document.meta_description = doc_info.get('meta_description', document.meta_description)
                        document.title = doc_info['title']  # Обновляем заголовок тоже
                        document.is_active = True
                        document.is_published = True
                        if not document.published_at:
                            document.published_at = timezone.now()
                        document.save()  # save() автоматически обновит slug и version
                        self.stdout.write(self.style.SUCCESS(f'✓ Обновлен документ: {doc_info["title"]}'))
                    else:
                        self.stdout.write(self.style.WARNING(f'○ Документ уже существует: {doc_info["title"]} (используйте --update для обновления)'))
                except Document.DoesNotExist:
                    # Документ не существует, создаем
                    document = Document.objects.create(
                        document_type=doc_info['document_type'],
                        title=doc_info['title'],
                        content=content,
                        content_text=content_text,
                        meta_title=doc_info.get('meta_title', ''),
                        meta_description=doc_info.get('meta_description', ''),
                        is_active=True,
                        is_published=True,
                        published_at=timezone.now(),
                    )
                    self.stdout.write(self.style.SUCCESS(f'✓ Создан документ: {doc_info["title"]}'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Ошибка при обработке {filename}: {str(e)}'))
                import traceback
                traceback.print_exc()
        
        self.stdout.write(self.style.SUCCESS('\nМиграция документов завершена!'))
        self.stdout.write(self.style.SUCCESS('Теперь документы можно редактировать в админке Django.'))

