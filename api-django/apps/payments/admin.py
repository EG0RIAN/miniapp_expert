from django.contrib import admin
from .models import PaymentMethod, Mandate, Payment, ManualCharge, Transaction


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('user', 'pan_mask', 'exp_date', 'status', 'is_default', 'provider', 'created_at')
    list_filter = ('status', 'provider', 'is_default', 'created_at')
    search_fields = ('user__email', 'pan_mask', 'rebill_id')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Mandate)
class MandateAdmin(admin.ModelAdmin):
    list_display = ('user', 'mandate_number', 'type', 'bank', 'status', 'signed_at', 'created_at')
    list_filter = ('type', 'bank', 'status', 'created_at')
    search_fields = ('user__email', 'mandate_number')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'amount', 'currency', 'status', 'method', 'provider_ref', 'created_at')
    list_filter = ('status', 'method', 'currency', 'created_at')
    search_fields = ('order__order_id', 'user__email', 'provider_ref')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('order', 'user', 'amount', 'currency', 'status', 'method')
        }),
        ('Провайдер', {
            'fields': ('provider_ref', 'failure_reason', 'receipt_url')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ManualCharge)
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


@admin.register(Transaction)
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

