"""
URL configuration for miniapp_api project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from miniapp_api.admin import admin_site  # Импортируем кастомный admin site
from apps.users.client_views import ClientDashboardView

urlpatterns = [
    path('admin/', admin_site.urls),  # Используем кастомный admin site с OTP
    path('api/auth/', include('apps.users.urls')),
    path('api/admin/', include('apps.orders.admin_urls')),
    path('api/admin/', include('apps.payments.admin_urls')),
    path('api/admin/', include('apps.users.admin_urls')),
    path('api/admin/', include('apps.affiliates.admin_urls')),
    path('api/admin/', include('apps.documents.admin_urls')),
    path('api/', include('apps.audit.urls')),
    path('api/documents/', include('apps.documents.api_urls')),  # API для документов
    path('api/client/dashboard/', ClientDashboardView.as_view(), name='client-dashboard'),
    path('api/client/', include('apps.orders.client_urls')),
    path('api/client/', include('apps.payments.client_urls')),
    path('api/client/', include('apps.products.client_urls')),
    path('api/client/', include('apps.documents.client_urls')),  # Client documents API
    path('api/client/', include('apps.affiliates.client_urls')),
    path('api/order/', include('apps.orders.client_urls')),  # Pre-order endpoints
    path('api/payment/', include('apps.payments.urls')),
    path('', include('apps.documents.urls')),  # Document pages (privacy.html, etc.)
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

