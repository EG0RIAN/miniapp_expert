from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum
from .models import User
from .serializers import UserSerializer, UserListSerializer
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.affiliates.models import Referral


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'admin'


class UserAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления пользователями в админке
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'email_verified', 'is_active']
    search_fields = ['email', 'name', 'phone', 'telegram_id', 'referral_code']
    ordering_fields = ['created_at', 'email']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.prefetch_related('referrals')
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Статистика по пользователю"""
        user = self.get_object()
        
        # Заказы
        orders = Order.objects.filter(user=user)
        total_orders = orders.count()
        total_spent = orders.filter(status='CONFIRMED').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Платежи
        payments = Payment.objects.filter(user=user)
        successful_payments = payments.filter(status='success').count()
        
        # Рефералы
        referrals_count = Referral.objects.filter(referrer=user).count()
        referrals_earned = Referral.objects.filter(referrer=user).aggregate(
            total=Sum('total_earned')
        )['total'] or 0
        
        return Response({
            'user_id': user.id,
            'email': user.email,
            'total_orders': total_orders,
            'total_spent': float(total_spent),
            'successful_payments': successful_payments,
            'referrals_count': referrals_count,
            'referrals_earned': float(referrals_earned),
        })
    
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        """Заказы пользователя"""
        user = self.get_object()
        orders = Order.objects.filter(user=user).order_by('-created_at')
        from apps.orders.serializers import OrderListSerializer
        serializer = OrderListSerializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Платежи пользователя"""
        user = self.get_object()
        payments = Payment.objects.filter(user=user).order_by('-created_at')
        from apps.payments.serializers import PaymentSerializer
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

