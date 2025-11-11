"""
URL configuration for miniapp_api project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
import miniapp_api.admin  # Импортируем кастомизацию админки
from apps.users.client_views import ClientDashboardView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/admin/', include('apps.orders.admin_urls')),
    path('api/admin/', include('apps.payments.admin_urls')),
    path('api/admin/', include('apps.users.admin_urls')),
    path('api/admin/', include('apps.affiliates.admin_urls')),
    path('api/client/dashboard/', ClientDashboardView.as_view(), name='client-dashboard'),
    path('api/client/', include('apps.orders.client_urls')),
    path('api/client/', include('apps.payments.client_urls')),
    path('api/client/', include('apps.products.client_urls')),
    path('api/client/', include('apps.affiliates.client_urls')),
    path('api/payment/', include('apps.payments.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

