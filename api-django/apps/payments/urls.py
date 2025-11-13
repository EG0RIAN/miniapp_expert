from django.urls import path
from .views import PaymentCreateView, PaymentWebhookView, PaymentStatusView
from .views_card_binding import CardBindingView

urlpatterns = [
    path('create', PaymentCreateView.as_view(), name='payment-create'),
    path('webhook', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('status', PaymentStatusView.as_view(), name='payment-status'),
    path('create-card-binding/', CardBindingView.as_view(), name='create-card-binding'),
]

