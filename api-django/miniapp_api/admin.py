"""
Кастомизация Django Admin
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# Изменить заголовок админки
admin.site.site_header = "MiniApp Expert Admin"
admin.site.site_title = "MiniApp Expert"
admin.site.index_title = "Панель управления"

