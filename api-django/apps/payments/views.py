from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction as db_transaction
from datetime import timedelta
from .models import Payment, Transaction
from .services import TBankService
from apps.orders.models import Order as OrderModel
from apps.products.models import UserProduct
from apps.affiliates.models import Referral, ReferralCommission


@method_decorator(csrf_exempt, name='dispatch')
class PaymentCreateView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        pre_order_id = request.data.get('pre_order_id')  # UUID предзаказа
        email = request.data.get('email')
        phone = request.data.get('phone')
        name = request.data.get('name')
        subscription_agreed = request.data.get('subscription_agreed', False)
        
        if not all([pre_order_id, email, phone, name]):
            return Response(
                {'success': False, 'message': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получить предзаказ
        try:
            from apps.orders.models import PreOrder
            pre_order = PreOrder.objects.get(id=pre_order_id, is_used=False)
            
            # Проверить, не истек ли предзаказ
            if timezone.now() > pre_order.expires_at:
                return Response(
                    {'success': False, 'message': 'Pre-order expired'},
                    status=status.HTTP_410_GONE
                )
        except PreOrder.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Pre-order not found or already used'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Генерация order_id
        order_id = f"ORDER_{int(timezone.now().timestamp() * 1000)}"
        
        # Создание заказа в БД
        try:
            order = OrderModel.objects.create(
                order_id=order_id,
                pre_order=pre_order,
                product=pre_order.product,
                amount=pre_order.amount,
                description=pre_order.product.description or pre_order.product.name,
                customer_email=email,
                customer_phone=phone,
                customer_name=name,
                referral_code=pre_order.referral_code,
                referred_by=pre_order.referred_by,
                subscription_agreed=subscription_agreed,
                subscription_agreed_at=timezone.now() if subscription_agreed else None,
                status='NEW',
            )
            
            # Пометить предзаказ как использованный
            pre_order.is_used = True
            pre_order.used_at = timezone.now()
            pre_order.save()
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Failed to create order: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Создание платежа через T-Bank
        tbank = TBankService()
        try:
            # Проверяем, является ли продукт подпиской
            is_subscription = pre_order.product.product_type == 'subscription'
            
            # Генерируем CustomerKey для рекуррентных платежей
            import uuid
            customer_key = None
            if is_subscription:
                # Используем email как основу для CustomerKey или генерируем UUID
                customer_key = f"customer_{email.replace('@', '_at_')}" if email else str(uuid.uuid4())
            
            result = tbank.init_payment(
                amount=float(pre_order.amount),
                order_id=order_id,
                description=pre_order.product.description or pre_order.product.name,
                email=email,
                phone=phone,
                name=name,
                save_method=is_subscription,  # Сохраняем карту для подписок
                is_subscription=is_subscription,
                product_name=pre_order.product.name,
                customer_key=customer_key,  # Передаем CustomerKey для Recurrent=Y
            )
            
            if result.get('Success'):
                # Обновление заказа
                order.payment_id = result.get('PaymentId')
                order.payment_url = result.get('PaymentURL')
                order.save()
                
                # Создание записи о платеже
                Payment.objects.create(
                    order=order,
                    amount=pre_order.amount,
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
                # Логируем детали ошибки для отладки
                error_message = result.get('Message', 'Payment creation failed')
                error_code = result.get('ErrorCode', 'UNKNOWN')
                import logging
                logger = logging.getLogger(__name__)
                logger.error(
                    f"T-Bank Init failed: ErrorCode={error_code}, Message={error_message}, "
                    f"Details={result.get('Details', 'N/A')}"
                )
                return Response(
                    {
                        'success': False, 
                        'message': error_message or 'Неверные параметры.',
                        'error_code': error_code,
                        'details': result.get('Details')
                    },
                    status=status.HTTP_400_BAD_REQUEST
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
        # T-Bank может отправлять RebillId в разных местах webhook - получаем позже при обработке подписки
        
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
                
                # Получаем URL чека из webhook (T-Bank может отправлять ReceiptURL, ReceiptUrl или Receipt)
                receipt_url = (
                    request.data.get('ReceiptURL') or 
                    request.data.get('ReceiptUrl') or 
                    request.data.get('Receipt') or
                    request.data.get('receipt_url')
                )
                
                # Если URL чека не пришел в webhook, пытаемся получить через API
                if not receipt_url and status_tbank == 'CONFIRMED' and payment_id:
                    try:
                        tbank = TBankService()
                        receipt_info = tbank.get_receipt(payment_id)
                        receipt_url = receipt_info.get('receipt_url')
                        if receipt_url:
                            print(f"Receipt URL получен через API для платежа {payment_id}: {receipt_url}")
                    except Exception as e:
                        print(f"Error getting receipt URL from T-Bank API: {e}")
                        import traceback
                        traceback.print_exc()
                
                # Сохраняем URL чека, если получен
                if receipt_url:
                    payment.receipt_url = receipt_url
                    print(f"Receipt URL сохранен для платежа {payment_id}: {receipt_url}")
                else:
                    print(f"Warning: Receipt URL не получен для платежа {payment_id}")
                
                payment.save()
            
            # Если платеж подтвержден, привязать к пользователю, создать продукт и транзакцию
            if status_tbank == 'CONFIRMED':
                try:
                    with db_transaction.atomic():
                        from apps.users.services import send_welcome_email
                        from apps.users.models import User
                        
                        # Найти или создать пользователя по email заказа
                        user = None
                        if order.customer_email:
                            user, created = User.objects.get_or_create(
                                email=order.customer_email,
                                defaults={
                                    'name': order.customer_name or order.customer_email.split('@')[0],
                                    'phone': order.customer_phone,
                                    'role': 'client',
                                    'is_active': True,
                                    'email_verified': True,
                                    'referred_by': order.referred_by,  # Установить реферера при создании
                                }
                            )
                            if not created:
                                # Обновляем данные пользователя
                                if order.customer_name:
                                    user.name = order.customer_name
                                if order.customer_phone:
                                    user.phone = order.customer_phone
                                user.email_verified = True
                                # Если пользователь еще не имеет реферера, устанавливаем его
                                if not user.referred_by and order.referred_by:
                                    user.referred_by = order.referred_by
                                user.save()
                            
                            # Привязываем заказ к пользователю
                            order.user = user
                            order.save()
                            
                            # Обновляем платеж - привязываем к пользователю
                            payment.user = user
                            
                            # Если receipt_url еще не сохранен, пытаемся получить его еще раз через get_receipt
                            if not payment.receipt_url and payment_id:
                                try:
                                    tbank = TBankService()
                                    receipt_info = tbank.get_receipt(payment_id)
                                    receipt_url = receipt_info.get('receipt_url')
                                    if receipt_url:
                                        payment.receipt_url = receipt_url
                                        print(f"Receipt URL получен в CONFIRMED блоке для платежа {payment_id}: {receipt_url}")
                                except Exception as e:
                                    print(f"Error getting receipt URL in CONFIRMED block: {e}")
                                    import traceback
                                    traceback.print_exc()
                            
                            payment.save()
                            
                            # Инициализируем переменную для payment_method (для связи с UserProduct)
                            payment_method = None
                            
                            # Если это подписка, сохраняем PaymentMethod для рекуррентных платежей
                            if order.product and order.product.product_type == 'subscription':
                                from apps.payments.models import PaymentMethod
                                
                                # T-Bank может отправить RebillId в webhook после успешной оплаты
                                # Проверяем несколько возможных мест, где может быть RebillId
                                rebill_id = (
                                    request.data.get('RebillId') or 
                                    request.data.get('CardId') or 
                                    request.data.get('RebillId')  # Повторная проверка
                                )
                                
                                # Если RebillId не пришел в webhook, пытаемся получить статус платежа через API
                                if not rebill_id:
                                    try:
                                        tbank = TBankService()
                                        payment_status = tbank.get_payment_status(payment_id)
                                        rebill_id = payment_status.get('RebillId') or payment_status.get('CardId')
                                    except Exception as e:
                                        print(f"Error getting payment status for RebillId: {e}")
                                
                                if rebill_id:
                                    # Получаем данные карты из webhook
                                    # T-Bank может отправлять данные в разных форматах
                                    card_info = request.data.get('CardId', {})
                                    if isinstance(card_info, dict):
                                        pan_mask = card_info.get('Pan', request.data.get('Pan', '**** **** **** ****'))
                                        exp_date = card_info.get('ExpDate', request.data.get('ExpDate', ''))
                                        card_type = card_info.get('CardType', request.data.get('CardType', ''))
                                    else:
                                        pan_mask = request.data.get('Pan', '**** **** **** ****')
                                        exp_date = request.data.get('ExpDate', '')
                                        card_type = request.data.get('CardType', '')
                                    
                                    # Сохраняем платежный метод для рекуррентных списаний
                                    payment_method, created = PaymentMethod.objects.get_or_create(
                                        user=user,
                                        rebill_id=str(rebill_id),
                                        defaults={
                                            'provider': 'tbank',
                                            'pan_mask': pan_mask or '**** **** **** ****',
                                            'exp_date': exp_date or '',
                                            'card_type': card_type or '',
                                            'status': 'active',
                                            'is_default': True,  # Делаем методом по умолчанию для подписки
                                        }
                                    )
                                    
                                    # Если метод уже существует, обновляем его
                                    if not created:
                                        payment_method.status = 'active'
                                        payment_method.is_default = True
                                        if pan_mask and pan_mask != '**** **** **** ****':
                                            payment_method.pan_mask = pan_mask
                                        if exp_date:
                                            payment_method.exp_date = exp_date
                                        if card_type:
                                            payment_method.card_type = card_type
                                        payment_method.save()
                                    
                                    # Создаем или обновляем мандат для рекуррентных платежей
                                    from apps.payments.models import Mandate
                                    mandate, mandate_created = Mandate.objects.get_or_create(
                                        user=user,
                                        mandate_number=f"TBANK_{rebill_id}",
                                        defaults={
                                            'type': 'rko',
                                            'bank': 'tbank',
                                            'status': 'active',
                                            'signed_at': timezone.now(),
                                        }
                                    )
                                    
                                    if not mandate_created and mandate.status != 'active':
                                        mandate.status = 'active'
                                        mandate.signed_at = timezone.now()
                                        mandate.save()
                            
                            # Создать UserProduct
                            user_product = None
                            if order.product:
                                # Определить даты начала и окончания
                                start_date = timezone.now()
                                end_date = None
                                
                                if order.product.product_type == 'subscription':
                                    # Для подписки устанавливаем период
                                    if order.product.subscription_period == 'monthly':
                                        end_date = start_date + timedelta(days=30)
                                    elif order.product.subscription_period == 'yearly':
                                        end_date = start_date + timedelta(days=365)
                                    
                                    # Для подписок ищем активный продукт пользователя или создаем новый
                                    # Для подписок может быть только один активный продукт на пользователя
                                    user_product = UserProduct.objects.filter(
                                        user=user,
                                        product=order.product,
                                        status='active'
                                    ).first()
                                    
                                    if user_product:
                                        # Обновляем существующий активный продукт (продление подписки)
                                        user_product.start_date = start_date
                                        if end_date:
                                            user_product.end_date = end_date
                                        user_product.renewal_price = order.product.price
                                        if payment_method:
                                            user_product.payment_method = payment_method
                                        user_product.status = 'active'
                                        user_product.save()
                                        print(f"UserProduct обновлен для пользователя {user.email}, продукт {order.product.name}")
                                    else:
                                        # Создаем новый продукт пользователя (подписка)
                                        user_product = UserProduct.objects.create(
                                            user=user,
                                            product=order.product,
                                            status='active',
                                            start_date=start_date,
                                            end_date=end_date,
                                            renewal_price=order.product.price,
                                            payment_method=payment_method,  # Связываем с PaymentMethod для автоматического списания
                                        )
                                        print(f"UserProduct создан для пользователя {user.email}, продукт {order.product.name}")
                                else:
                                    # Для одноразовых продуктов (one_time) всегда создаем новый UserProduct
                                    # Пользователь может иметь несколько одноразовых продуктов
                                    user_product = UserProduct.objects.create(
                                        user=user,
                                        product=order.product,
                                        status='active',
                                        start_date=start_date,
                                        end_date=None,  # Для одноразовых продуктов end_date не устанавливается
                                        renewal_price=None,  # Для одноразовых продуктов renewal_price не нужен
                                        payment_method=None,  # Для одноразовых продуктов payment_method не нужен
                                    )
                                    print(f"UserProduct создан (one_time) для пользователя {user.email}, продукт {order.product.name}")
                            
                            # Создать транзакцию
                            transaction = Transaction.objects.create(
                                user=user,
                                order=order,
                                payment=payment,
                                transaction_type='payment',
                                amount=order.amount,
                                currency=order.currency,
                                description=order.description,
                                provider_ref=payment_id,
                            )
                            print(f"Transaction создана для пользователя {user.email}, сумма {order.amount} {order.currency}, платеж {payment_id}")
                            
                            # Начислить комиссию рефералу, если есть
                            if order.referred_by and order.referred_by != user:
                                try:
                                    # Найти или создать реферальную связь
                                    referral, created = Referral.objects.get_or_create(
                                        referrer=order.referred_by,
                                        referred_user=user,
                                        defaults={
                                            'status': 'active',
                                            'commission_rate': 20.00,  # 20% комиссия
                                        }
                                    )
                                    
                                    if not created and referral.status != 'active':
                                        referral.status = 'active'
                                        referral.save()
                                    
                                    # Рассчитать комиссию (20% от суммы заказа)
                                    commission_rate = referral.commission_rate
                                    commission_amount = (order.amount * commission_rate) / 100
                                    
                                    # Создать запись о комиссии
                                    ReferralCommission.objects.create(
                                        referral=referral,
                                        order=order,
                                        amount=order.amount,
                                        commission_rate=commission_rate,
                                        commission_amount=commission_amount,
                                        status='pending',
                                    )
                                    
                                    # Обновить общий заработок реферера
                                    referral.total_earned += commission_amount
                                    referral.save()
                                except Exception as e:
                                    print(f"Error creating referral commission: {e}")
                                    import traceback
                                    traceback.print_exc()
                            
                            # Отправить welcome email
                            try:
                                send_welcome_email(user, order)
                                print(f"Welcome email отправлен пользователю {user.email}")
                            except Exception as e:
                                print(f"Error sending welcome email to {user.email}: {e}")
                                import traceback
                                traceback.print_exc()
                            
                            print(f"✅ Успешная оплата обработана: пользователь {user.email}, продукт {order.product.name if order.product else 'N/A'}, сумма {order.amount} {order.currency}, receipt_url: {payment.receipt_url or 'не получен'}")
                            
                except Exception as e:
                    print(f"❌ Error processing payment confirmation: {e}")
                    import traceback
                    traceback.print_exc()
                
        except OrderModel.DoesNotExist:
            pass
        
        return Response('OK', status=status.HTTP_200_OK)


class PaymentStatusView(views.APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get payment status by orderId"""
        order_id = request.query_params.get('orderId')
        
        if not order_id:
            return Response(
                {'success': False, 'message': 'Order ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            order = OrderModel.objects.get(order_id=order_id)
            payment = Payment.objects.filter(order=order).first()
            
            response_data = {
                'success': True,
                'order': {
                    'orderId': order.order_id,
                    'status': order.status,
                    'customerEmail': order.customer_email,
                    'customerName': order.customer_name,
                    'amount': str(order.amount),
                    'description': order.description,
                },
                'payment': {
                    'status': payment.status if payment else 'pending',
                    'paymentId': order.payment_id,
                    'method': payment.method if payment else 'card',
                } if payment else None,
            }
            
            # Если платеж подтвержден и заказ привязан к пользователю, возвращаем токен для авторизации
            if order.status == 'CONFIRMED' and order.user:
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(order.user)
                response_data['authToken'] = str(refresh.access_token)
                response_data['user'] = {
                    'email': order.user.email,
                    'name': order.user.name,
                }
            
            return Response(response_data)
        except OrderModel.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Failed to get payment status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
