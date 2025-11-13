"""
Django Admin для запросов на отмену подписки
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models_cancellation import CancellationRequest


@admin.register(CancellationRequest)
class CancellationRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'requested_by_link',
        'product_name',
        'referrer_link',
        'status_badge',
        'time_left_display',
        'created_at',
        'expires_at',
    ]
    
    list_filter = [
        'status',
        'created_at',
        'referrer_notified',
        'reminder_sent',
    ]
    
    search_fields = [
        'requested_by__email',
        'requested_by__first_name',
        'requested_by__last_name',
        'referrer__email',
        'cancellation_reason',
    ]
    
    readonly_fields = [
        'id',
        'created_at',
        'expires_at',
        'decided_at',
        'time_left_display',
        'is_expired',
    ]
    
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('id', 'user_product', 'status', 'cancellation_reason')
        }),
        ('Участники', {
            'fields': ('requested_by', 'referrer', 'decided_by')
        }),
        ('Решение', {
            'fields': ('decided_at', 'decision_comment')
        }),
        ('Даты и сроки', {
            'fields': ('created_at', 'expires_at', 'time_left_display', 'is_expired')
        }),
        ('Уведомления', {
            'fields': ('referrer_notified', 'reminder_sent')
        }),
    )
    
    def requested_by_link(self, obj):
        """Ссылка на пользователя, запросившего отмену"""
        if obj.requested_by:
            return format_html(
                '<a href="/admin/users/user/{}/change/">{}</a>',
                obj.requested_by.id,
                obj.requested_by.email
            )
        return '-'
    requested_by_link.short_description = 'Пользователь'
    
    def referrer_link(self, obj):
        """Ссылка на реферала"""
        if obj.referrer:
            return format_html(
                '<a href="/admin/users/user/{}/change/">{}</a>',
                obj.referrer.id,
                obj.referrer.email
            )
        return format_html('<span style="color: #999;">Нет реферала</span>')
    referrer_link.short_description = 'Реферал'
    
    def product_name(self, obj):
        """Название продукта"""
        return obj.user_product.product.name
    product_name.short_description = 'Продукт'
    
    def status_badge(self, obj):
        """Красивый бейдж статуса"""
        colors = {
            'pending': '#FFA500',
            'approved': '#28A745',
            'rejected': '#DC3545',
            'expired': '#6C757D',
        }
        labels = {
            'pending': 'Ожидает',
            'approved': 'Одобрено',
            'rejected': 'Отклонено',
            'expired': 'Истекло',
        }
        color = colors.get(obj.status, '#999')
        label = labels.get(obj.status, obj.status)
        
        return format_html(
            '<span style="background: {}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">{}</span>',
            color,
            label
        )
    status_badge.short_description = 'Статус'
    
    def time_left_display(self, obj):
        """Отображение оставшегося времени"""
        if obj.status != 'pending':
            return '-'
        
        if obj.is_expired:
            return format_html('<span style="color: red; font-weight: bold;">Истекло</span>')
        
        time_left = obj.time_left
        delta = obj.expires_at - timezone.now()
        hours_left = delta.total_seconds() / 3600
        
        if hours_left < 1:
            color = 'red'
        elif hours_left < 6:
            color = 'orange'
        else:
            color = 'green'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            time_left
        )
    time_left_display.short_description = 'Осталось времени'
    
    actions = ['mark_as_expired']
    
    def mark_as_expired(self, request, queryset):
        """Действие: пометить как истекшие и отменить подписки"""
        count = 0
        for obj in queryset.filter(status='pending'):
            obj.expire()
            count += 1
        
        self.message_user(
            request,
            f'Отменено подписок: {count}'
        )
    mark_as_expired.short_description = 'Отменить подписки (истекло)'

