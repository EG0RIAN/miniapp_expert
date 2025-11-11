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
            
            # Если receipt_url отсутствует, но платеж успешен, пытаемся получить его через T-Bank API
            if not payment.receipt_url and payment.status == 'success' and payment.provider_ref:
                try:
                    from .services import TBankService
                    tbank = TBankService()
                    receipt_info = tbank.get_receipt(payment.provider_ref)
                    if receipt_info.get('receipt_url'):
                        payment.receipt_url = receipt_info['receipt_url']
                        payment.save(update_fields=['receipt_url'])
                except Exception as e:
                    print(f"Error getting receipt URL for payment {payment_id}: {e}")
            
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
    """Управление платежными методами пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Список платежных методов пользователя"""
        payment_methods = PaymentMethod.objects.filter(user=request.user, status='active').order_by('-is_default', '-created_at')
        serializer = PaymentMethodSerializer(payment_methods, many=True)
        return Response({
            'success': True,
            'methods': serializer.data
        })


class ClientPaymentMethodDetailView(views.APIView):
    """Управление конкретным платежным методом"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, method_id):
        """Установить карту как дефолтную"""
        try:
            payment_method = PaymentMethod.objects.get(id=method_id, user=request.user, status='active')
            
            # Если устанавливаем как дефолтную, снимаем флаг с других карт
            if request.data.get('is_default', False):
                PaymentMethod.objects.filter(user=request.user, is_default=True).update(is_default=False)
                payment_method.is_default = True
                payment_method.save(update_fields=['is_default'])
                
                return Response({
                    'success': True,
                    'message': 'Карта установлена как основная',
                    'method': PaymentMethodSerializer(payment_method).data
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid request'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except PaymentMethod.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Payment method not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, method_id):
        """Удалить (деактивировать) карту"""
        try:
            payment_method = PaymentMethod.objects.get(id=method_id, user=request.user, status='active')
            
            # Если это дефолтная карта, нельзя удалить
            if payment_method.is_default:
                return Response(
                    {'success': False, 'message': 'Нельзя удалить основную карту. Сначала установите другую карту как основную.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Деактивируем карту (не удаляем, чтобы сохранить историю)
            payment_method.status = 'revoked'
            payment_method.save(update_fields=['status'])
            
            return Response({
                'success': True,
                'message': 'Карта успешно удалена'
            })
            
        except PaymentMethod.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Payment method not found'},
                status=status.HTTP_404_NOT_FOUND
            )


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


class ClientPaymentReceiptView(views.APIView):
    """Получение чека для платежа"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, payment_id):
        """Получить URL чека или информацию о чеке"""
        try:
            payment = Payment.objects.get(id=payment_id, user=request.user)
            
            # Если чек уже есть, возвращаем его
            if payment.receipt_url:
                return Response({
                    'success': True,
                    'receipt_url': payment.receipt_url,
                    'payment_id': str(payment.id),
                })
            
            # Если платеж успешен, но чека нет, пытаемся получить через T-Bank API
            if payment.status == 'success' and payment.provider_ref:
                try:
                    from .services import TBankService
                    tbank = TBankService()
                    receipt_info = tbank.get_receipt(payment.provider_ref)
                    
                    if receipt_info.get('receipt_url'):
                        # Сохраняем URL чека в базе данных
                        payment.receipt_url = receipt_info['receipt_url']
                        payment.save(update_fields=['receipt_url'])
                        
                        return Response({
                            'success': True,
                            'receipt_url': receipt_info['receipt_url'],
                            'payment_id': str(payment.id),
                        })
                    else:
                        # Чек еще не сформирован или недоступен
                        return Response({
                            'success': False,
                            'message': 'Чек еще не доступен. Чек будет отправлен на ваш email после обработки платежа.',
                            'receipt_url': None,
                        }, status=status.HTTP_202_ACCEPTED)
                except Exception as e:
                    print(f"Error getting receipt from T-Bank: {e}")
                    return Response({
                        'success': False,
                        'message': f'Ошибка получения чека: {str(e)}',
                        'receipt_url': None,
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                # Платеж не успешен или нет provider_ref
                return Response({
                    'success': False,
                    'message': 'Чек доступен только для успешных платежей',
                    'receipt_url': None,
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Payment.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
