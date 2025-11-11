from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum
from .models import Referral, ReferralPayout, ReferralCommission
from .serializers import ReferralSerializer, ReferralPayoutSerializer, ReferralCommissionSerializer
from apps.users.models import User


class IsAdminOrFinanceManager(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['admin', 'finance_manager']


class ReferralAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления рефералами в админке
    """
    queryset = Referral.objects.all()
    serializer_class = ReferralSerializer
    permission_classes = [IsAdminOrFinanceManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['referrer__email', 'referred_user__email']
    ordering_fields = ['created_at', 'total_earned']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('referrer', 'referred_user')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по реферальной программе"""
        total_referrals = Referral.objects.count()
        active_referrals = Referral.objects.filter(status='active').count()
        total_earned = Referral.objects.aggregate(
            total=Sum('total_earned')
        )['total'] or 0
        total_paid_out = Referral.objects.aggregate(
            total=Sum('paid_out')
        )['total'] or 0
        
        # Топ рефералов
        top_referrers = Referral.objects.values('referrer__email').annotate(
            count=Count('id'),
            total_earned=Sum('total_earned')
        ).order_by('-total_earned')[:10]
        
        return Response({
            'total_referrals': total_referrals,
            'active_referrals': active_referrals,
            'total_earned': float(total_earned),
            'total_paid_out': float(total_paid_out),
            'top_referrers': list(top_referrers),
        })


class ReferralPayoutAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления выплатами рефералов в админке
    """
    queryset = ReferralPayout.objects.all()
    serializer_class = ReferralPayoutSerializer
    permission_classes = [IsAdminOrFinanceManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'currency']
    search_fields = ['referrer__email', 'payment_ref', 'notes']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('referrer')


class ReferralCommissionAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint для просмотра комиссий рефералов в админке
    """
    queryset = ReferralCommission.objects.all()
    serializer_class = ReferralCommissionSerializer
    permission_classes = [IsAdminOrFinanceManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['referral__referrer__email', 'order__order_id']
    ordering_fields = ['created_at', 'commission_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('referral', 'order', 'payout')

