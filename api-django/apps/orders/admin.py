from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'customer_email', 'customer_name', 'amount', 'currency', 'status', 'product', 'created_at')
    list_filter = ('status', 'currency', 'subscription_agreed', 'created_at')
    search_fields = ('order_id', 'customer_email', 'customer_name', 'customer_phone', 'payment_id')
    readonly_fields = ('order_id', 'payment_id', 'payment_url', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('order_id', 'user', 'product', 'amount', 'currency', 'status', 'description')
        }),
        ('Информация о клиенте', {
            'fields': ('customer_name', 'customer_email', 'customer_phone')
        }),
        ('Платежная информация', {
            'fields': ('payment_id', 'payment_url', 'subscription_agreed', 'subscription_agreed_at')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )

