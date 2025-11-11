from django.urls import path
from .views import PreOrderCreateView, PreOrderDetailView

urlpatterns = [
    path('pre-order/create', PreOrderCreateView.as_view(), name='pre-order-create'),
    path('pre-order/<uuid:pre_order_id>', PreOrderDetailView.as_view(), name='pre-order-detail'),
]
