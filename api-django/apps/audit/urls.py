from django.urls import path

from .views import TrackingEventView, CartTrackingView

urlpatterns = [
    path('events', TrackingEventView.as_view(), name='tracking-events'),
    path('cart/track', CartTrackingView.as_view(), name='cart-track'),
]





