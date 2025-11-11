"""
API URLs для документов (админка)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import DocumentAdminViewSet

router = DefaultRouter()
router.register(r'documents', DocumentAdminViewSet, basename='admin-document')

urlpatterns = [
    path('', include(router.urls)),
]

