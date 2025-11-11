from django.contrib import admin
from .models import Product, UserProduct


class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'price', 'currency', 'product_type', 'has_admin_url', 'subscription_terms', 'is_active', 'created_at')
    list_filter = ('product_type', 'is_active', 'created_at')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    
    def has_admin_url(self, obj):
        """Проверка наличия URL админки"""
        return bool(obj.admin_url)
    has_admin_url.short_description = 'Админка'
    has_admin_url.boolean = True
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'slug', 'description', 'price', 'currency', 'product_type', 'subscription_period', 'is_active')
        }),
        ('Условия подписки', {
            'fields': ('subscription_terms',),
            'description': 'Условия подписки для данного продукта. Выберите документ типа "Условия подписки" из админки документов.'
        }),
        ('Ссылки на продукт', {
            'fields': ('admin_url',),
            'description': 'URL админки продукта (общий для всех пользователей). URL приложения задается индивидуально для каждого пользователя в разделе "Продукты пользователей".'
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class UserProductAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'status', 'has_app_url', 'start_date', 'end_date', 'created_at')
    list_filter = ('status', 'product', 'created_at')
    search_fields = ('user__email', 'product__name')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    def has_app_url(self, obj):
        """Проверка наличия URL приложения"""
        return bool(obj.app_url)
    has_app_url.short_description = 'Приложение'
    has_app_url.boolean = True
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'product', 'status', 'start_date', 'end_date', 'renewal_price', 'payment_method')
        }),
        ('Ссылки', {
            'fields': ('app_url',),
            'description': 'URL приложения (Mini App) для данного пользователя. Если не указан, кнопка "Приложение" будет неактивной в личном кабинете пользователя.'
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

