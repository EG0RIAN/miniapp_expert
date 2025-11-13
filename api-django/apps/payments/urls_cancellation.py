"""
URLs для запросов на отмену подписки
"""
from django.urls import path
from .views_cancellation import (
    CancellationRequestCreateView,
    MyCancellationRequestsView,
    ReferralCancellationRequestsView,
    CancellationRequestDecisionView,
)

urlpatterns = [
    # Создать запрос на отмену
    path('cancellation-requests/', CancellationRequestCreateView.as_view(), name='cancellation-request-create'),
    
    # Мои запросы на отмену
    path('my-cancellation-requests/', MyCancellationRequestsView.as_view(), name='my-cancellation-requests'),
    
    # Запросы от моих рефералов
    path('referral-cancellation-requests/', ReferralCancellationRequestsView.as_view(), name='referral-cancellation-requests'),
    
    # Принять решение (только реферал)
    path('cancellation-requests/<uuid:request_id>/decision/', CancellationRequestDecisionView.as_view(), name='cancellation-request-decision'),
]

