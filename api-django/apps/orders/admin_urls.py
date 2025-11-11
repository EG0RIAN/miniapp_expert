from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import OrderAdminViewSet

router = DefaultRouter()
router.register(r'orders', OrderAdminViewSet, basename='admin-order')

urlpatterns = [
    path('', include(router.urls)),
]

