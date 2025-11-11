from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum
from django.utils import timezone
from .models import User
from .serializers import UserSerializer
from apps.products.models import UserProduct
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.affiliates.models import Referral, ReferralCommission


class ClientDashboardView(views.APIView):
    """Дашборд пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Статистика продуктов
        active_products = UserProduct.objects.filter(
            user=user,
            status='active'
        ).count()
        
        # Статистика подписок
        active_subscriptions = UserProduct.objects.filter(
            user=user,
            status='active',
            product__product_type='subscription'
        ).count()
        
        # Статистика платежей
        total_payments = Payment.objects.filter(user=user, status='success').count()
        total_spent = Payment.objects.filter(
            user=user,
            status='success'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Последние транзакции
        recent_payments = Payment.objects.filter(
            user=user
        ).select_related('order', 'order__product').order_by('-created_at')[:5]
        
        recent_payments_data = [{
            'id': str(p.id),
            'amount': float(p.amount),
            'currency': p.currency,
            'status': p.status,
            'method': p.method,
            'description': p.order.description if p.order else 'Payment',
            'created_at': p.created_at.isoformat() if p.created_at else None,
        } for p in recent_payments]
        
        # Реферальная статистика
        referrals_count = Referral.objects.filter(referrer=user).count()
        referral_earned = ReferralCommission.objects.filter(
            referral__referrer=user
        ).aggregate(total=Sum('commission_amount'))['total'] or 0
        
        # Уведомления (можно расширить)
        notifications = []
        
        return Response({
            'success': True,
            'balance': 0,  # Можно добавить баланс пользователя
            'active_products': active_products,
            'subscriptions': active_subscriptions,
            'total_payments': total_payments,
            'notifications': notifications,
            'recent_transactions': recent_payments_data,
            'referral_stats': {
                'invites': referrals_count,
                'earned': float(referral_earned)
            }
        })

