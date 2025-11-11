from django.urls import path
from .client_views import (
    ClientReferralsView,
    ClientReferralPayoutsView,
    ClientRequestPayoutView
)

urlpatterns = [
    path('referrals/', ClientReferralsView.as_view(), name='client-referrals'),
    path('referrals/payouts/', ClientReferralPayoutsView.as_view(), name='client-referral-payouts'),
    path('referrals/request-payout/', ClientRequestPayoutView.as_view(), name='client-request-payout'),
]

