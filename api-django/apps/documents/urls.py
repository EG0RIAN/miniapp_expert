"""
URLs для документов
"""
from django.urls import path
from . import views

# URLs для HTML страниц
urlpatterns = [
    path('privacy.html', views.privacy_view, name='privacy'),
    path('affiliate-terms.html', views.affiliate_terms_view, name='affiliate-terms'),
    path('cabinet-terms.html', views.cabinet_terms_view, name='cabinet-terms'),
    path('subscription-terms.html', views.subscription_terms_view, name='subscription-terms'),
    path('document/<slug:slug>.html', views.document_view, name='document'),
]

