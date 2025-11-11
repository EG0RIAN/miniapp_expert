from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Q
from .models import Order
from .serializers import OrderSerializer, OrderListSerializer
from apps.users.models import User
from apps.audit.middleware import AuditLogMiddleware


class IsAdminOrFinanceManager(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['admin', 'finance_manager']


class OrderAdminViewSet(viewsets.ModelViewSet):
    """
    API endpoint для управления заказами в админке
    Показывает все продажи с фильтрацией и статистикой
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAdminOrFinanceManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'currency', 'subscription_agreed']
    search_fields = ['order_id', 'customer_email', 'customer_name', 'customer_phone', 'payment_id']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Фильтр по дате
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Фильтр по пользователю
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.select_related('user', 'product')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по продажам"""
        queryset = self.get_queryset()
        
        # Период
        period = request.query_params.get('period', 'all')  # all, today, week, month, year
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
        total_orders = queryset.count()
        total_amount = queryset.filter(status='CONFIRMED').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        confirmed_orders = queryset.filter(status='CONFIRMED').count()
        pending_orders = queryset.filter(status__in=['NEW', 'AUTHORIZING']).count()
        failed_orders = queryset.filter(status__in=['REJECTED', 'AUTH_FAIL']).count()
        
        # По статусам
        status_stats = queryset.values('status').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-count')
        
        # По продуктам
        product_stats = queryset.filter(status='CONFIRMED').values('product__name').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-total_amount')
        
        return Response({
            'period': period,
            'total_orders': total_orders,
            'total_amount': float(total_amount),
            'confirmed_orders': confirmed_orders,
            'pending_orders': pending_orders,
            'failed_orders': failed_orders,
            'status_stats': list(status_stats),
            'product_stats': list(product_stats),
        })
    
    def update(self, request, *args, **kwargs):
        """Обновление заказа с аудитом"""
        instance = self.get_object()
        before = OrderListSerializer(instance).data
        
        response = super().update(request, *args, **kwargs)
        
        after = OrderListSerializer(self.get_object()).data
        AuditLogMiddleware.log(
            action='order_updated',
            entity_type='Order',
            entity_id=str(instance.id),
            actor=request.user,
            before=before,
            after=after,
            request=request
        )
        
        return response

