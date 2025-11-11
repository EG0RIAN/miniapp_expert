from django.urls import path
from .client_views import ClientProductsView, AvailableProductsView

urlpatterns = [
    path('products/', ClientProductsView.as_view(), name='client-products'),
    path('products/available/', AvailableProductsView.as_view(), name='client-available-products'),
]

