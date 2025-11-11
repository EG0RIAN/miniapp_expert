from django.contrib import admin
from .models import Product, UserProduct


class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'price', 'currency', 'product_type', 'subscription_terms', 'is_active', 'created_at')
    list_filter = ('product_type', 'is_active', 'created_at')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'slug', 'description', 'price', 'currency', 'product_type', 'subscription_period', 'is_active')
        }),
        ('Условия подписки', {
            'fields': ('subscription_terms',),
            'description': 'Условия подписки для данного продукта. Выберите документ типа "Условия подписки" из админки документов.'
        }),
        ('Ссылки на продукт', {
            'fields': ('app_url', 'admin_url'),
            'description': 'URL ссылки для кнопок "Приложение" и "Админка" в личном кабинете пользователя. Если не указаны, кнопки будут неактивными.'
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class UserProductAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'status', 'start_date', 'end_date', 'created_at')
    list_filter = ('status', 'product', 'created_at')
    search_fields = ('user__email', 'product__name')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'

