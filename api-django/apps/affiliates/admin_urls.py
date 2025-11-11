from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import ReferralAdminViewSet, ReferralPayoutAdminViewSet, ReferralCommissionAdminViewSet

router = DefaultRouter()
router.register(r'referrals', ReferralAdminViewSet, basename='admin-referral')
router.register(r'referral-payouts', ReferralPayoutAdminViewSet, basename='admin-referral-payout')
router.register(r'referral-commissions', ReferralCommissionAdminViewSet, basename='admin-referral-commission')

urlpatterns = [
    path('', include(router.urls)),
]

