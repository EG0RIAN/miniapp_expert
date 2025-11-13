"""
Celery tasks для автоматического списания подписок
"""
from celery import shared_task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)


@shared_task(name='apps.payments.tasks.process_recurring_payments')
def process_recurring_payments():
    """
    Обработка рекуррентных платежей для истекающих подписок
    Запускается автоматически через Celery Beat каждый день
    """
    logger.info('Starting recurring payments processing task')
    try:
        call_command('process_recurring_payments')
        logger.info('Recurring payments processing completed successfully')
        return 'Success'
    except Exception as e:
        logger.error(f'Error processing recurring payments: {e}')
        raise


@shared_task(name='apps.payments.tasks.send_subscription_reminders')
def send_subscription_reminders(days_before=3):
    """
    Отправка напоминаний о предстоящем списании подписки
    Запускается автоматически через Celery Beat каждый день
    """
    logger.info(f'Starting subscription reminders task (days_before={days_before})')
    try:
        call_command('send_subscription_reminders', f'--days-before={days_before}')
        logger.info('Subscription reminders sent successfully')
        return 'Success'
    except Exception as e:
        logger.error(f'Error sending subscription reminders: {e}')
        raise


@shared_task(name='apps.payments.tasks.retry_failed_payment')
def retry_failed_payment(payment_id):
    """
    Повторная попытка списания для неудачного платежа
    """
    from apps.payments.models import Payment, PaymentMethod
    from apps.payments.services import TBankService
    from apps.products.models import UserProduct
    from django.utils import timezone
    from datetime import timedelta
    
    logger.info(f'Retrying payment: {payment_id}')
    
    try:
        payment = Payment.objects.get(id=payment_id)
        
        if payment.status != 'failed':
            logger.warning(f'Payment {payment_id} is not in failed status, skipping')
            return 'Skipped - not failed'
        
        user = payment.user
        order = payment.order
        
        if not order or not order.product:
            logger.error(f'Payment {payment_id} has no order or product')
            return 'Error - no order/product'
        
        product = order.product
        
        # Находим активный платежный метод пользователя
        payment_method = PaymentMethod.objects.filter(
            user=user,
            status='active'
        ).first()
        
        if not payment_method:
            logger.error(f'No active payment method for user {user.email}')
            return 'Error - no payment method'
        
        tbank = TBankService()
        
        # Пытаемся списать еще раз
        result = tbank.charge_by_rebill(
            rebill_id=payment_method.rebill_id,
            amount=float(order.amount),
            order_id=order.order_id,
            description=order.description or f'Повторная попытка оплаты: {product.name}',
            email=user.email,
            phone=user.phone,
            product_name=product.name,
        )
        
        if result.get('Success') and result.get('Status') in ['CONFIRMED', 'AUTHORIZED']:
            payment.status = 'success'
            payment.provider_ref = result.get('PaymentId')
            payment.save()
            
            order.status = 'CONFIRMED'
            order.payment_id = result.get('PaymentId')
            order.save()
            
            # Если это подписка, продлеваем
            if product.product_type == 'subscription':
                user_product = UserProduct.objects.filter(
                    user=user,
                    product=product,
                    status__in=['active', 'expired']
                ).first()
                
                if user_product:
                    if product.subscription_period == 'monthly':
                        new_end_date = timezone.now() + timedelta(days=30)
                    elif product.subscription_period == 'yearly':
                        new_end_date = timezone.now() + timedelta(days=365)
                    else:
                        new_end_date = timezone.now() + timedelta(days=30)
                    
                    user_product.end_date = new_end_date
                    user_product.status = 'active'
                    user_product.save()
            
            logger.info(f'Payment retry successful: {payment_id}')
            return 'Success'
        else:
            logger.error(f'Payment retry failed: {payment_id} - {result.get("Message")}')
            return f'Failed - {result.get("Message")}'
            
    except Exception as e:
        logger.exception(f'Exception retrying payment {payment_id}: {e}')
        raise

