from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import models
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'email_verified', 'referral_code', 'referred_by', 'created_at', 'get_related_counts')
    list_filter = ('role', 'email_verified', 'is_active', 'created_at')
    search_fields = ('email', 'name', 'referral_code', 'telegram_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'referral_code', 'get_related_counts_display')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Персональная информация', {'fields': ('name', 'phone', 'telegram_id')}),
        ('Права доступа', {'fields': ('role', 'is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Верификация', {'fields': ('email_verified', 'verification_token', 'reset_token', 'reset_token_expires_at')}),
        ('Оферта', {'fields': ('offer_accepted_at', 'offer_version')}),
        ('Реферальная программа', {'fields': ('referral_code', 'referred_by')}),
        ('Связанные данные', {'fields': ('get_related_counts_display',)}),
        ('Важные даты', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'name'),
        }),
    )
    
    def get_related_counts(self, obj):
        """Показать количество связанных записей"""
        if not obj.pk:
            return '-'
        
        counts = []
        try:
            orders_count = obj.orders.count() if hasattr(obj, 'orders') else 0
            payments_count = obj.payments.count() if hasattr(obj, 'payments') else 0
            payment_methods_count = obj.payment_methods.count() if hasattr(obj, 'payment_methods') else 0
            manual_charges_count = obj.manual_charges.count() if hasattr(obj, 'manual_charges') else 0
            referrals_given_count = obj.referrals_given.count() if hasattr(obj, 'referrals_given') else 0
            referrals_received_count = obj.referrals_received.count() if hasattr(obj, 'referrals_received') else 0
            payouts_count = obj.payouts.count() if hasattr(obj, 'payouts') else 0
            
            if orders_count > 0:
                counts.append(f'Заказы: {orders_count}')
            if payments_count > 0:
                counts.append(f'Платежи: {payments_count}')
            if payment_methods_count > 0:
                counts.append(f'Методы: {payment_methods_count}')
            if manual_charges_count > 0:
                counts.append(f'Списания: {manual_charges_count}')
            if referrals_given_count > 0:
                counts.append(f'Рефералы: {referrals_given_count}')
            if payouts_count > 0:
                counts.append(f'Выплаты: {payouts_count}')
            
            if counts:
                return ', '.join(counts)
            return 'Нет данных'
        except Exception as e:
            return f'Ошибка: {str(e)}'
    get_related_counts.short_description = 'Связанные данные'
    
    def get_related_counts_display(self, obj):
        """Детальное отображение связанных данных"""
        if not obj.pk:
            return '-'
        
        try:
            html = '<ul style="list-style: none; padding: 0;">'
            
            orders_count = obj.orders.count() if hasattr(obj, 'orders') else 0
            payments_count = obj.payments.count() if hasattr(obj, 'payments') else 0
            payment_methods_count = obj.payment_methods.count() if hasattr(obj, 'payment_methods') else 0
            manual_charges_count = obj.manual_charges.count() if hasattr(obj, 'manual_charges') else 0
            mandates_count = obj.mandates.count() if hasattr(obj, 'mandates') else 0
            referrals_given_count = obj.referrals_given.count() if hasattr(obj, 'referrals_given') else 0
            referrals_received_count = obj.referrals_received.count() if hasattr(obj, 'referrals_received') else 0
            payouts_count = obj.payouts.count() if hasattr(obj, 'payouts') else 0
            audit_logs_count = obj.audit_logs.count() if hasattr(obj, 'audit_logs') else 0
            
            html += f'<li>Заказы: <strong>{orders_count}</strong></li>'
            html += f'<li>Платежи: <strong>{payments_count}</strong></li>'
            html += f'<li>Платежные методы: <strong>{payment_methods_count}</strong></li>'
            html += f'<li>Ручные списания: <strong>{manual_charges_count}</strong></li>'
            html += f'<li>Мандаты: <strong>{mandates_count}</strong></li>'
            html += f'<li>Рефералы (данные): <strong>{referrals_given_count}</strong></li>'
            html += f'<li>Рефералы (получено): <strong>{referrals_received_count}</strong></li>'
            html += f'<li>Выплаты: <strong>{payouts_count}</strong></li>'
            html += f'<li>Записи аудита: <strong>{audit_logs_count}</strong></li>'
            
            html += '</ul>'
            
            total = orders_count + payments_count + payment_methods_count + manual_charges_count + mandates_count + referrals_given_count + referrals_received_count + payouts_count
            
            if total > 0:
                html += f'<p style="margin-top: 10px; color: #d32f2f;"><strong>Внимание:</strong> При удалении пользователя все связанные данные будут удалены или обнулены в зависимости от настроек.</p>'
            
            return format_html(html)
        except Exception as e:
            return f'Ошибка: {str(e)}'
    get_related_counts_display.short_description = 'Связанные данные'
    
    def get_referrals_count(self, obj):
        return obj.referrals.count() if hasattr(obj, 'referrals') else 0
    get_referrals_count.short_description = 'Рефералов'
    
    def delete_model(self, request, obj):
        """Кастомное удаление с обработкой связанных данных"""
        from django.contrib import messages
        try:
            # Проверяем, не пытаемся ли удалить текущего пользователя
            if obj.pk == request.user.pk:
                messages.error(request, 'Нельзя удалить самого себя!')
                return
            
            # Сохраняем email для сообщения (так как после delete он будет недоступен)
            user_email = obj.email
            
            # Удаляем пользователя (связанные данные будут обработаны через CASCADE/SET NULL)
            obj.delete()
            messages.success(request, f'Пользователь {user_email} успешно удален.')
        except Exception as e:
            import traceback
            error_msg = f'Ошибка при удалении пользователя: {str(e)}'
            messages.error(request, error_msg)
            # Логируем полную ошибку для отладки
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error deleting user {obj.email if obj else "unknown"}: {traceback.format_exc()}')
            raise
    
    def delete_queryset(self, request, queryset):
        """Массовое удаление"""
        from django.contrib import messages
        try:
            # Исключаем текущего пользователя
            queryset = queryset.exclude(pk=request.user.pk)
            count = queryset.count()
            
            if count == 0:
                messages.warning(request, 'Нет пользователей для удаления (вы не можете удалить самого себя).')
                return
            
            # Удаляем пользователей
            queryset.delete()
            messages.success(request, f'Удалено пользователей: {count}.')
        except Exception as e:
            import traceback
            error_msg = f'Ошибка при массовом удалении: {str(e)}'
            messages.error(request, error_msg)
            # Логируем полную ошибку для отладки
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error deleting users: {traceback.format_exc()}')
            raise
    
    def has_delete_permission(self, request, obj=None):
        """Проверка прав на удаление"""
        # Разрешаем удаление всех пользователей (кроме самого себя, что проверяется в delete_model)
        return super().has_delete_permission(request, obj)

