from django.urls import path
from .client_views import (
    ClientPaymentsView,
    ClientPaymentDetailView,
    ClientPaymentMethodsView,
    ClientTransactionsView
)

urlpatterns = [
    path('payments/', ClientPaymentsView.as_view(), name='client-payments'),
    path('payments/<uuid:payment_id>/', ClientPaymentDetailView.as_view(), name='client-payment-detail'),
    path('payment-methods/', ClientPaymentMethodsView.as_view(), name='client-payment-methods'),
    path('transactions/', ClientTransactionsView.as_view(), name='client-transactions'),
]

