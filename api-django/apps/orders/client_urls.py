from django.urls import path
from .client_views import ClientOrdersView, ClientOrderDetailView

urlpatterns = [
    path('orders/', ClientOrdersView.as_view(), name='client-orders'),
    path('orders/<uuid:order_id>/', ClientOrderDetailView.as_view(), name='client-order-detail'),
]

