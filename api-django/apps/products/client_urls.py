from django.urls import path
from .client_views import ClientProductsView, AvailableProductsView, CancelSubscriptionView

urlpatterns = [
    path('products/', ClientProductsView.as_view(), name='client-products'),
    path('products/available/', AvailableProductsView.as_view(), name='client-available-products'),
    path('subscriptions/<uuid:subscription_id>/cancel/', CancelSubscriptionView.as_view(), name='client-cancel-subscription'),
]

