"""
Админ-интерфейс для управления документами
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django import forms
from .models import Document, DocumentAcceptance


class DocumentAdminForm(forms.ModelForm):
    """Форма для редактирования документов с текстовой областью"""
    class Meta:
        model = Document
        fields = '__all__'
        widgets = {
            'content': forms.Textarea(attrs={
                'rows': 30,
                'cols': 100,
                'class': 'vLargeTextField',
                'style': 'font-family: monospace; font-size: 13px;',
            }),
            'content_text': forms.Textarea(attrs={
                'rows': 5,
                'cols': 100,
                'class': 'vLargeTextField',
            }),
            'meta_description': forms.Textarea(attrs={
                'rows': 3,
                'cols': 100,
                'class': 'vLargeTextField',
            }),
        }


class DocumentAdmin(admin.ModelAdmin):
    """Админка для управления документами"""
    form = DocumentAdminForm
    list_display = ('document_type', 'title', 'is_active', 'is_published', 'version', 'updated_at', 'preview_link')
    list_filter = ('document_type', 'is_active', 'is_published', 'created_at', 'updated_at')
    search_fields = ('title', 'content_text', 'meta_title', 'meta_description')
    readonly_fields = ('created_at', 'updated_at', 'published_at', 'version', 'preview_link', 'content_help')
    prepopulated_fields = {'slug': ('title',)}
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('document_type', 'title', 'slug', 'is_active', 'is_published')
        }),
        ('Содержание', {
            'fields': ('content_help', 'content', 'content_text'),
            'description': 'Поле content поддерживает HTML разметку. content_text используется для поиска и SEO.'
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Метаданные', {
            'fields': ('version', 'created_at', 'updated_at', 'published_at', 'preview_link'),
            'classes': ('collapse',)
        }),
    )
    
    def content_help(self, obj):
        """Подсказка по использованию HTML"""
        help_text = """
        <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
            <strong>Подсказка по редактированию:</strong><br>
            • Поле поддерживает HTML разметку<br>
            • Используйте теги: &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, &lt;strong&gt;, &lt;em&gt;<br>
            • Классы Tailwind CSS: <code>text-gray-700</code>, <code>mb-4</code>, <code>space-y-4</code> и т.д.<br>
            • Пример структуры:<br>
            <pre style="background: white; padding: 10px; border: 1px solid #ddd; margin-top: 5px;">
&lt;section&gt;
    &lt;h2 class="text-2xl font-bold mb-4"&gt;Заголовок&lt;/h2&gt;
    &lt;p class="text-gray-700 mb-4"&gt;Текст параграфа&lt;/p&gt;
    &lt;ul class="list-disc list-inside space-y-2"&gt;
        &lt;li&gt;Пункт списка&lt;/li&gt;
    &lt;/ul&gt;
&lt;/section&gt;</pre>
        </div>
        """
        return format_html(help_text)
    content_help.short_description = 'Справка'
    
    # Временно отключено: статические файлы не существуют
    # class Media:
    #     css = {
    #         'all': ('admin/css/document_admin.css',)
    #     }
    #     js = ('admin/js/document_admin.js',)
    
    def preview_link(self, obj):
        """Ссылка для предпросмотра документа"""
        if obj.pk and obj.is_published:
            url = obj.get_absolute_url()
            return format_html(
                '<a href="{}" target="_blank" class="button">Предпросмотр</a>',
                url
            )
        return '-'
    preview_link.short_description = 'Предпросмотр'
    
    def get_readonly_fields(self, request, obj=None):
        """Делаем document_type неизменяемым после создания"""
        readonly = list(self.readonly_fields)
        if obj:  # Если объект уже существует
            readonly.append('document_type')
        return readonly
    
    def save_model(self, request, obj, form, change):
        """Переопределяем сохранение для логирования изменений"""
        # Версия обновляется в методе save() модели
        super().save_model(request, obj, form, change)
    
    actions = ['publish_documents', 'unpublish_documents', 'activate_documents', 'deactivate_documents']
    
    def publish_documents(self, request, queryset):
        """Опубликовать выбранные документы"""
        count = queryset.update(is_published=True)
        self.message_user(request, f'{count} документов опубликовано.')
    publish_documents.short_description = 'Опубликовать выбранные документы'
    
    def unpublish_documents(self, request, queryset):
        """Снять с публикации выбранные документы"""
        count = queryset.update(is_published=False)
        self.message_user(request, f'{count} документов снято с публикации.')
    unpublish_documents.short_description = 'Снять с публикации выбранные документы'
    
    def activate_documents(self, request, queryset):
        """Активировать выбранные документы"""
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} документов активировано.')
    activate_documents.short_description = 'Активировать выбранные документы'
    
    def deactivate_documents(self, request, queryset):
        """Деактивировать выбранные документы"""
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} документов деактивировано.')
    deactivate_documents.short_description = 'Деактивировать выбранные документы'


class DocumentAcceptanceAdmin(admin.ModelAdmin):
    """Админка для просмотра принятых документов"""
    list_display = ('user', 'document', 'version', 'accepted_at', 'ip_address')
    list_filter = ('document__document_type', 'version', 'accepted_at')
    search_fields = ('user__email', 'user__name', 'document__title')
    readonly_fields = ('id', 'user', 'document', 'version', 'accepted_at', 'ip_address', 'user_agent')
    date_hierarchy = 'accepted_at'
    
    def has_add_permission(self, request):
        """Запрещаем создание записей через админку"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Запрещаем изменение записей через админку"""
        return False

