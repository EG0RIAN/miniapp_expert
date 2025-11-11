from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Q
from .models import Payment, ManualCharge, Transaction
from .serializers import PaymentSerializer, ManualChargeSerializer, TransactionSerializer
from apps.audit.middleware import AuditLogMiddleware


class IsAdminOrFinanceManager(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['admin', 'finance_manager']


class PaymentAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления платежами в админке
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrFinanceManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'method', 'currency']
    search_fields = ['provider_ref', 'order__order_id', 'user__email']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('order', 'user')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по платежам"""
        queryset = self.get_queryset()
        
        # Период
        period = request.query_params.get('period', 'all')
        now = timezone.now()
        
        if period == 'today':
            queryset = queryset.filter(created_at__date=now.date())
        elif period == 'week':
            queryset = queryset.filter(created_at__gte=now - timedelta(days=7))
        elif period == 'month':
            queryset = queryset.filter(created_at__gte=now - timedelta(days=30))
        elif period == 'year':
            queryset = queryset.filter(created_at__gte=now - timedelta(days=365))
        
        # Статистика
        total_payments = queryset.count()
        total_amount = queryset.filter(status='success').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        successful_payments = queryset.filter(status='success').count()
        failed_payments = queryset.filter(status='failed').count()
        pending_payments = queryset.filter(status='pending').count()
        
        # По методам
        method_stats = queryset.values('method').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-count')
        
        return Response({
            'period': period,
            'total_payments': total_payments,
            'total_amount': float(total_amount),
            'successful_payments': successful_payments,
            'failed_payments': failed_payments,
            'pending_payments': pending_payments,
            'method_stats': list(method_stats),
        })


class ManualChargeAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления ручными списаниями в админке
    """
    queryset = ManualCharge.objects.all()
    serializer_class = ManualChargeSerializer
    permission_classes = [IsAdminOrFinanceManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'channel', 'currency']
    search_fields = ['user__email', 'provider_ref', 'reason', 'idempotency_key']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('user', 'initiator', 'payment_method', 'mandate')
    
    def perform_create(self, serializer):
        """Создание ручного списания с аудитом"""
        instance = serializer.save(initiator=self.request.user)
        AuditLogMiddleware.log(
            action='manual_charge_created',
            entity_type='ManualCharge',
            entity_id=str(instance.id),
            actor=self.request.user,
            before=None,
            after=ManualChargeSerializer(instance).data,
            request=self.request
        )
        return instance


class TransactionAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint для просмотра всех транзакций в админке
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminOrFinanceManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['transaction_type', 'currency']
    search_fields = ['user__email', 'order__order_id', 'provider_ref', 'description']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related('user', 'order', 'payment', 'manual_charge')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по транзакциям"""
        queryset = self.get_queryset()
        
        # Период
        period = request.query_params.get('period', 'all')
        now = timezone.now()
        
        if period == 'today':
            queryset = queryset.filter(created_at__date=now.date())
        elif period == 'week':
            queryset = queryset.filter(created_at__gte=now - timedelta(days=7))
        elif period == 'month':
            queryset = queryset.filter(created_at__gte=now - timedelta(days=30))
        elif period == 'year':
            queryset = queryset.filter(created_at__gte=now - timedelta(days=365))
        
        # Статистика
        total_transactions = queryset.count()
        total_amount = queryset.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # По типам
        type_stats = queryset.values('transaction_type').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-count')
        
        return Response({
            'period': period,
            'total_transactions': total_transactions,
            'total_amount': float(total_amount),
            'type_stats': list(type_stats),
        })

