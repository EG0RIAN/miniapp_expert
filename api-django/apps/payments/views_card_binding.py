"""
View для привязки карты через тестовый платеж
"""
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
import uuid
import logging

from .services import TBankService
from .models import Payment
from apps.orders.models import Order as OrderModel

logger = logging.getLogger(__name__)


class CardBindingView(views.APIView):
    """Создание тестового платежа для привязки карты"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Создать тестовый платеж на 1 рубль для привязки карты.
        После успешной оплаты карта будет привязана, а деньги вернутся.
        """
        try:
            user = request.user
            return_url = request.data.get('return_url', 'https://miniapp.expert/cabinet.html#cards')
            
            # Создать заказ для привязки карты
            order = OrderModel.objects.create(
                order_id=f"card_bind_{user.id}_{uuid.uuid4().hex[:8]}",
                user=user,
                amount=1.00,  # 1 рубль
                currency='RUB',
                status='NEW',
                description='Привязка банковской карты',
                customer_email=user.email
            )
            
            # Создать платеж
            payment = Payment.objects.create(
                order=order,
                user=user,
                amount=1.00,
                currency='RUB',
                status='pending',
                method='card'
            )
            
            # Инициализировать платеж в T-Bank
            tbank = TBankService()
            
            # Генерировать CustomerKey для пользователя
            customer_key = f"user_{user.id}"
            
            result = tbank.init_payment(
                amount=100,  # 1 рубль в копейках
                order_id=order.order_id,
                description='Привязка банковской карты',
                email=user.email,
                phone='',  # Телефон не обязателен для привязки карты
                name=user.full_name or user.email.split('@')[0],  # Имя пользователя или часть email
                customer_key=customer_key,
                save_method=True,
                is_subscription=False
            )
            
            if result.get('Success'):
                payment_url = result.get('PaymentURL')
                payment_id = result.get('PaymentId')
                
                # Обновить payment
                payment.provider_ref = payment_id
                payment.save()
                
                logger.info(f"Card binding payment created for user {user.email}: {payment_id}")
                
                return Response({
                    'success': True,
                    'payment_url': payment_url,
                    'payment_id': payment_id,
                    'order_id': order.order_id,
                    'message': 'Перенаправляем на страницу оплаты...'
                }, status=status.HTTP_201_CREATED)
            else:
                error_message = result.get('Message', 'Ошибка при создании платежа')
                error_code = result.get('ErrorCode', 'UNKNOWN')
                
                logger.error(f"T-Bank error for card binding: {error_code} - {error_message}")
                
                payment.status = 'failed'
                payment.failure_reason = f"{error_code}: {error_message}"
                payment.save()
                
                return Response({
                    'success': False,
                    'error': error_message,
                    'error_code': error_code,
                    'details': result.get('Details')
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.exception(f"Error creating card binding payment: {e}")
            return Response({
                'success': False,
                'error': 'Ошибка при создании платежа для привязки карты'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

