from django.contrib import admin

# Import cancellation request admin
from .admin_cancellation import CancellationRequestAdmin
from django.utils.html import format_html
from .models import PaymentMethod, Mandate, Payment, ManualCharge, Transaction


class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('user', 'pan_mask', 'exp_date', 'status', 'is_default', 'provider', 'created_at')
    list_filter = ('status', 'provider', 'is_default', 'created_at')
    search_fields = ('user__email', 'pan_mask', 'rebill_id')
    readonly_fields = ('created_at', 'updated_at')


class MandateAdmin(admin.ModelAdmin):
    list_display = ('user', 'mandate_number', 'type', 'bank', 'status', 'signed_at', 'created_at')
    list_filter = ('type', 'bank', 'status', 'created_at')
    search_fields = ('user__email', 'mandate_number')
    readonly_fields = ('created_at', 'updated_at')


class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'amount', 'currency', 'status', 'method', 'receipt_link', 'created_at')
    list_filter = ('status', 'method', 'currency', 'created_at')
    search_fields = ('order__order_id', 'user__email', 'provider_ref')
    readonly_fields = ('created_at', 'updated_at', 'receipt_link')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('order', 'user', 'amount', 'currency', 'status', 'method')
        }),
        ('Провайдер', {
            'fields': ('provider_ref', 'failure_reason', 'receipt_url', 'receipt_link')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def receipt_link(self, obj):
        """Отображение ссылки на чек"""
        if obj.receipt_url:
            return format_html(
                '<a href="{}" target="_blank" style="background: #417690; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; display: inline-block;">📄 Открыть чек</a>',
                obj.receipt_url
            )
        elif obj.status == 'success' and obj.provider_ref:
            return format_html('<span style="color: #999;">Чек формируется...</span>')
        return format_html('<span style="color: #999;">—</span>')
    receipt_link.short_description = 'Чек'


class ManualChargeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'currency', 'channel', 'status', 'initiator', 'created_at')
    list_filter = ('status', 'channel', 'currency', 'created_at')
    search_fields = ('user__email', 'provider_ref', 'reason', 'idempotency_key')
    readonly_fields = ('created_at', 'updated_at', 'processed_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'amount', 'currency', 'reason', 'channel', 'status')
        }),
        ('Метод списания', {
            'fields': ('payment_method', 'mandate')
        }),
        ('Провайдер', {
            'fields': ('provider_ref', 'failure_reason', 'idempotency_key', 'processed_at')
        }),
        ('Инициатор', {
            'fields': ('initiator',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )


class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'transaction_type', 'amount', 'currency', 'order', 'created_at')
    list_filter = ('transaction_type', 'currency', 'created_at')
    search_fields = ('user__email', 'order__order_id', 'provider_ref', 'description')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'transaction_type', 'amount', 'currency', 'description')
        }),
        ('Связи', {
            'fields': ('order', 'payment', 'manual_charge')
        }),
        ('Провайдер', {
            'fields': ('provider_ref',)
        }),
        ('Даты', {
            'fields': ('created_at',)
        }),
    )

