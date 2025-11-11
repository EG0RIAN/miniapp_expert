"""
Модель для управления документами
"""
import uuid
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from apps.users.models import User


class Document(models.Model):
    """Модель для хранения документов (политика конфиденциальности, условия использования и т.д.)"""
    
    DOCUMENT_TYPES = [
        ('privacy', 'Политика конфиденциальности'),
        ('affiliate_terms', 'Условия партнерской программы'),
        ('cabinet_terms', 'Условия использования личного кабинета'),
        ('subscription_terms', 'Условия подписки'),
        ('other', 'Другое'),
    ]
    
    document_type = models.CharField(
        max_length=50,
        choices=DOCUMENT_TYPES,
        unique=True,
        verbose_name='Тип документа'
    )
    title = models.CharField(max_length=255, verbose_name='Заголовок')
    slug = models.SlugField(max_length=255, unique=True, blank=True, verbose_name='URL')
    content = models.TextField(verbose_name='Содержание (HTML)')
    content_text = models.TextField(blank=True, verbose_name='Содержание (текст)')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    is_published = models.BooleanField(default=True, verbose_name='Опубликован')
    meta_title = models.CharField(max_length=255, blank=True, verbose_name='Meta title')
    meta_description = models.TextField(blank=True, verbose_name='Meta description')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлен')
    published_at = models.DateTimeField(null=True, blank=True, verbose_name='Опубликован')
    version = models.IntegerField(default=1, verbose_name='Версия')
    
    class Meta:
        db_table = 'documents'
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['document_type', 'is_active', 'is_published']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.title}"
    
    def save(self, *args, **kwargs):
        # Автоматически создаем slug из title, если не указан
        if not self.slug or self.slug == '':
            if self.title:
                self.slug = slugify(self.title)
            # Если slug все еще пустой, используем document_type как fallback
            if not self.slug or self.slug == '':
                self.slug = self.document_type
        
        # Убеждаемся, что slug уникален (добавляем суффикс, если нужно)
        if self.pk:
            # Для существующего документа проверяем, не занят ли slug другим документом
            existing = Document.objects.filter(slug=self.slug).exclude(pk=self.pk).first()
            if existing:
                # Если slug занят, добавляем суффикс
                base_slug = self.slug
                counter = 1
                while Document.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                    self.slug = f"{base_slug}-{counter}"
                    counter += 1
        else:
            # Для нового документа проверяем уникальность
            base_slug = self.slug
            counter = 1
            while Document.objects.filter(slug=self.slug).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
        
        # Если документ публикуется впервые, устанавливаем published_at
        if self.is_published and not self.published_at:
            self.published_at = timezone.now()
        
        # Если документ был опубликован и снова публикуется, обновляем published_at
        if self.is_published and self.pk:
            try:
                old_doc = Document.objects.get(pk=self.pk)
                if not old_doc.is_published:
                    self.published_at = timezone.now()
                    self.version += 1
                elif old_doc.content != self.content or old_doc.title != self.title:
                    # Если контент изменился, увеличиваем версию
                    if self.is_published:
                        self.version += 1
            except Document.DoesNotExist:
                # Новый документ
                if self.is_published:
                    self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        """Возвращает URL документа"""
        if self.document_type == 'privacy':
            return '/privacy.html'
        elif self.document_type == 'affiliate_terms':
            return '/affiliate-terms.html'
        elif self.document_type == 'cabinet_terms':
            return '/cabinet-terms.html'
        elif self.document_type == 'subscription_terms':
            return '/subscription-terms.html'
        else:
            return f'/document/{self.slug}.html'


class DocumentAcceptance(models.Model):
    """Модель для хранения подписанных документов пользователями"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_acceptances')
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='acceptances')
    version = models.IntegerField(verbose_name='Версия документа')
    accepted_at = models.DateTimeField(auto_now_add=True, verbose_name='Подписан')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='IP адрес')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')
    
    class Meta:
        db_table = 'document_acceptances'
        verbose_name = 'Подписанный документ'
        verbose_name_plural = 'Подписанные документы'
        ordering = ['-accepted_at']
        unique_together = [['user', 'document', 'version']]
        indexes = [
            models.Index(fields=['user', 'document']),
            models.Index(fields=['-accepted_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.document.get_document_type_display()} v{self.version}"
