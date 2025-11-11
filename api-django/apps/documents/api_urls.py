"""
API URLs для документов
"""
from django.urls import path
from .public_views import PublicDocumentView

urlpatterns = [
    path('', PublicDocumentView.as_view(), name='public-documents'),
    path('<str:document_type>/', PublicDocumentView.as_view(), name='public-document-detail'),
]

