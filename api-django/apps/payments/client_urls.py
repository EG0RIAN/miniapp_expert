from django.urls import path
from .client_views import (
    ClientPaymentsView,
    ClientPaymentDetailView,
    ClientPaymentMethodsView,
    ClientPaymentMethodDetailView,
    ClientTransactionsView,
    ClientPaymentReceiptView,
)

urlpatterns = [
    path('payments/', ClientPaymentsView.as_view(), name='client-payments'),
    path('payments/<uuid:payment_id>/', ClientPaymentDetailView.as_view(), name='client-payment-detail'),
    path('payments/<uuid:payment_id>/receipt/', ClientPaymentReceiptView.as_view(), name='client-payment-receipt'),
    path('payment-methods/', ClientPaymentMethodsView.as_view(), name='client-payment-methods'),
    path('payment-methods/<uuid:method_id>/', ClientPaymentMethodDetailView.as_view(), name='client-payment-method-detail'),
    path('transactions/', ClientTransactionsView.as_view(), name='client-transactions'),
]

