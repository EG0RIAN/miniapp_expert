from django.contrib import admin
from .models import Product, UserProduct


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'price', 'currency', 'product_type', 'is_active', 'created_at')
    list_filter = ('product_type', 'is_active', 'created_at')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')


@admin.register(UserProduct)
class UserProductAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'status', 'start_date', 'end_date', 'created_at')
    list_filter = ('status', 'product', 'created_at')
    search_fields = ('user__email', 'product__name')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'

