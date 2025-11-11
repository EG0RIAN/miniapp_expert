from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.utils import timezone
from .models import Payment, PaymentMethod, ManualCharge, Transaction
from .serializers import PaymentSerializer, PaymentMethodSerializer, TransactionSerializer


class ClientPaymentsView(views.APIView):
    """Список платежей пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        payments = Payment.objects.filter(user=request.user).select_related('order', 'order__product').order_by('-created_at')
        
        # Фильтрация по статусу
        status_filter = request.query_params.get('status')
        if status_filter:
            payments = payments.filter(status=status_filter)
        
        # Пагинация
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 50))
        offset = (page - 1) * limit
        
        total = payments.count()
        payments = payments[offset:offset + limit]
        
        serializer = PaymentSerializer(payments, many=True)
        
        # Общая сумма
        total_amount = Payment.objects.filter(
            user=request.user,
            status='success'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'success': True,
            'payments': serializer.data,
            'total': total,
            'total_amount': float(total_amount),
            'page': page,
            'limit': limit
        })


class ClientPaymentDetailView(views.APIView):
    """Детали платежа пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id, user=request.user)
            serializer = PaymentSerializer(payment)
            return Response({
                'success': True,
                'payment': serializer.data
            })
        except Payment.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class ClientPaymentMethodsView(views.APIView):
    """Список платежных методов пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        payment_methods = PaymentMethod.objects.filter(user=request.user, status='active').order_by('-is_default', '-created_at')
        serializer = PaymentMethodSerializer(payment_methods, many=True)
        return Response({
            'success': True,
            'methods': serializer.data
        })


class ClientTransactionsView(views.APIView):
    """Список транзакций пользователя (все типы)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user).select_related('order', 'payment').order_by('-created_at')
        
        # Пагинация
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 50))
        offset = (page - 1) * limit
        
        total = transactions.count()
        transactions = transactions[offset:offset + limit]
        
        serializer = TransactionSerializer(transactions, many=True)
        
        return Response({
            'success': True,
            'transactions': serializer.data,
            'total': total,
            'page': page,
            'limit': limit
        })

