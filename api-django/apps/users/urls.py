from django.urls import path
from .views import HealthView, LoginView, RegisterView, ProfileView, VerifyEmailView, RequestPasswordResetView, ResetPasswordView, ResendVerificationEmailView

urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('password-reset/', RequestPasswordResetView.as_view(), name='password-reset'),
    path('password-reset/confirm/', ResetPasswordView.as_view(), name='password-reset-confirm'),
]

