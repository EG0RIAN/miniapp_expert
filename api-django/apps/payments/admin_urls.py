from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import PaymentAdminViewSet, ManualChargeAdminViewSet, TransactionAdminViewSet

router = DefaultRouter()
router.register(r'payments', PaymentAdminViewSet, basename='admin-payment')
router.register(r'manual-charges', ManualChargeAdminViewSet, basename='admin-manual-charge')
router.register(r'transactions', TransactionAdminViewSet, basename='admin-transaction')

urlpatterns = [
    path('', include(router.urls)),
]

