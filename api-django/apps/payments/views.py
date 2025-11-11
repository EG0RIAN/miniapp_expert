from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Payment, Order
from .services import TBankService
from apps.orders.models import Order as OrderModel


@method_decorator(csrf_exempt, name='dispatch')
class PaymentCreateView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        amount = request.data.get('amount')
        order_id = request.data.get('orderId')
        description = request.data.get('description')
        email = request.data.get('email')
        phone = request.data.get('phone')
        name = request.data.get('name')
        
        if not all([amount, order_id, description, email, phone]):
            return Response(
                {'success': False, 'message': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создание заказа в БД
        try:
            order = OrderModel.objects.create(
                order_id=order_id,
                amount=amount,
                description=description,
                customer_email=email,
                customer_phone=phone,
                customer_name=name,
                status='NEW',
            )
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Failed to create order: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Создание платежа через T-Bank
        tbank = TBankService()
        try:
            result = tbank.init_payment(
                amount=float(amount),
                order_id=order_id,
                description=description,
                email=email,
                phone=phone,
                name=name,
            )
            
            if result.get('Success'):
                # Обновление заказа
                order.payment_id = result.get('PaymentId')
                order.payment_url = result.get('PaymentURL')
                order.save()
                
                # Создание записи о платеже
                Payment.objects.create(
                    order=order,
                    amount=amount,
                    status='pending',
                    method='card',
                    provider_ref=result.get('PaymentId'),
                )
                
                return Response({
                    'success': True,
                    'paymentId': result.get('PaymentId'),
                    'paymentUrl': result.get('PaymentURL'),
                    'orderId': order_id,
                })
            else:
                return Response(
                    {'success': False, 'message': result.get('Message', 'Payment creation failed')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Payment error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentWebhookView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        status_tbank = request.data.get('Status')
        payment_id = request.data.get('PaymentId')
        order_id = request.data.get('OrderId')
        
        if not order_id:
            return Response('OK', status=status.HTTP_200_OK)
        
        try:
            order = OrderModel.objects.get(order_id=order_id)
            order.status = status_tbank
            order.payment_id = payment_id
            order.save()
            
            # Обновление платежа
            payment = Payment.objects.filter(order=order).first()
            if payment:
                payment.status = 'success' if status_tbank == 'CONFIRMED' else 'failed'
                payment.provider_ref = payment_id
                payment.save()
            
            # Если платеж подтвержден, отправить welcome email
            if status_tbank == 'CONFIRMED':
                try:
                    from apps.users.services import send_welcome_email
                    from apps.users.models import User
                    
                    # Найти или создать пользователя по email заказа
                    if order.customer_email:
                        user, created = User.objects.get_or_create(
                            email=order.customer_email,
                            defaults={
                                'name': order.customer_name or order.customer_email.split('@')[0],
                                'phone': order.customer_phone,
                                'role': 'client',
                                'is_active': True,
                            }
                        )
                        if not created and order.customer_name:
                            user.name = order.customer_name
                            user.phone = order.customer_phone or user.phone
                            user.save()
                        
                        # Отправить welcome email
                        send_welcome_email(user, order)
                except Exception as e:
                    print(f"Error sending welcome email: {e}")
                
        except OrderModel.DoesNotExist:
            pass
        
        return Response('OK', status=status.HTTP_200_OK)


class PaymentStatusView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        payment_id = request.data.get('paymentId')
        
        if not payment_id:
            return Response(
                {'success': False, 'message': 'Payment ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tbank = TBankService()
        try:
            result = tbank.get_payment_status(payment_id)
            return Response({
                'success': result.get('Success', False),
                'status': result.get('Status'),
                'paymentId': result.get('PaymentId'),
                'amount': result.get('Amount'),
            })
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Failed to get payment status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

