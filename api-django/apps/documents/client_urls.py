"""
Client URLs для документов
"""
from django.urls import path
from .client_views import ClientDocumentsView, ClientDocumentAcceptView

urlpatterns = [
    path('documents/', ClientDocumentsView.as_view(), name='client-documents'),
    path('documents/accept/<str:document_type>/', ClientDocumentAcceptView.as_view(), name='client-document-accept'),
]

