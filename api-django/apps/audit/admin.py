from django.contrib import admin
from .models import AuditLog, TrackingEvent


class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'entity_type', 'entity_id', 'action', 'actor_email', 'actor_role', 'ip_address', 'created_at')
    list_filter = ('entity_type', 'action', 'actor_role', 'created_at')
    search_fields = ('entity_type', 'entity_id', 'actor_email', 'action')
    readonly_fields = ('id', 'entity_type', 'entity_id', 'action', 'actor', 'actor_email', 'actor_role', 'before', 'after', 'ip_address', 'user_agent', 'created_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('entity_type', 'entity_id', 'action')
        }),
        ('Актор', {
            'fields': ('actor', 'actor_email', 'actor_role')
        }),
        ('Изменения', {
            'fields': ('before', 'after')
        }),
        ('Метаданные', {
            'fields': ('ip_address', 'user_agent', 'created_at')
        }),
    )
    
    def has_add_permission(self, request):
        return False


class TrackingEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'category', 'session_id', 'user_identifier', 'cart_id', 'cart_status', 'created_at')
    list_filter = ('category', 'event', 'cart_status', 'created_at')
    search_fields = ('event', 'session_id', 'user_identifier', 'cart_id')
    readonly_fields = (
        'id',
        'event',
        'category',
        'session_id',
        'user_identifier',
        'cart_id',
        'cart_status',
        'page',
        'referrer',
        'payload',
        'ip_address',
        'user_agent',
        'created_at',
    )
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

