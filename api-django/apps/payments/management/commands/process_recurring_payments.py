"""
Management command для обработки рекуррентных платежей (автоматическое списание подписок)
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from apps.products.models import UserProduct
from apps.payments.models import Payment, PaymentMethod
from apps.orders.models import Order
from apps.payments.services import TBankService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Обрабатывает рекуррентные платежи для истекающих подписок'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Режим тестирования без реального списания',
        )
        parser.add_argument(
            '--days-ahead',
            type=int,
            default=0,
            help='Количество дней вперед для проверки (по умолчанию: 0 - только сегодня)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days_ahead = options['days_ahead']
        
        now = timezone.now()
        target_date = now + timedelta(days=days_ahead)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 РЕЖИМ ТЕСТИРОВАНИЯ (dry-run)'))
        
        self.stdout.write(f'Поиск подписок для списания за {target_date.date()}...')
        
        # Находим активные подписки, которые истекают сегодня или раньше
        # и у которых есть привязанный платежный метод (RebillId)
        user_products = UserProduct.objects.filter(
            status='active',
            product__product_type='subscription',
            end_date__lte=target_date,
            payment_method__isnull=False,
            payment_method__status='active'
        ).select_related('user', 'product', 'payment_method')
        
        self.stdout.write(f'Найдено {user_products.count()} подписок для списания')
        
        success_count = 0
        failed_count = 0
        skipped_count = 0
        
        tbank = TBankService()
        
        for user_product in user_products:
            user = user_product.user
            product = user_product.product
            payment_method = user_product.payment_method
            
            try:
                self.stdout.write(f'\n📋 Обработка: {user.email} - {product.name}')
                self.stdout.write(f'   RebillId: {payment_method.rebill_id}')
                self.stdout.write(f'   Сумма: {product.price} {product.currency}')
                self.stdout.write(f'   Истекает: {user_product.end_date}')
                
                if dry_run:
                    self.stdout.write(self.style.WARNING('   ⏭️  Пропущено (dry-run)'))
                    skipped_count += 1
                    continue
                
                # Создаем заказ для рекуррентного платежа
                order = Order.objects.create(
                    user=user,
                    product=product,
                    amount=product.price,
                    currency=product.currency,
                    status='NEW',
                    order_id=f'RECURRING_{user_product.id}_{now.strftime("%Y%m%d%H%M%S")}',
                    customer_email=user.email,
                    customer_name=user.name,
                    customer_phone=user.phone,
                    description=f'Автоматическое продление подписки: {product.name}',
                )
                
                # Создаем запись о платеже
                payment = Payment.objects.create(
                    user=user,
                    order=order,
                    amount=product.price,
                    currency=product.currency,
                    status='pending',
                    method='card',
                )
                
                # Выполняем списание через T-Bank API
                result = tbank.charge_by_rebill(
                    rebill_id=payment_method.rebill_id,
                    amount=float(product.price),
                    order_id=order.order_id,
                    description=f'Автоматическое продление подписки: {product.name}',
                    email=user.email,
                    phone=user.phone,
                    product_name=product.name,
                )
                
                if result.get('Success') and result.get('Status') in ['CONFIRMED', 'AUTHORIZED']:
                    # Списание успешно
                    payment.status = 'success'
                    payment.provider_ref = result.get('PaymentId')
                    payment.save()
                    
                    order.status = 'CONFIRMED'
                    order.payment_id = result.get('PaymentId')
                    order.save()
                    
                    # Продлеваем подписку на следующий период
                    if product.subscription_period == 'monthly':
                        new_end_date = user_product.end_date + timedelta(days=30)
                    elif product.subscription_period == 'yearly':
                        new_end_date = user_product.end_date + timedelta(days=365)
                    else:
                        new_end_date = user_product.end_date + timedelta(days=30)
                    
                    user_product.end_date = new_end_date
                    user_product.save()
                    
                    success_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'   ✅ Успешно списано! PaymentId: {result.get("PaymentId")}'
                        )
                    )
                    self.stdout.write(f'   📅 Подписка продлена до: {new_end_date}')
                    
                    logger.info(
                        f'Recurring payment success: user={user.email}, '
                        f'product={product.name}, amount={product.price}, '
                        f'payment_id={result.get("PaymentId")}'
                    )
                else:
                    # Списание не удалось
                    payment.status = 'failed'
                    payment.failure_reason = result.get('Message', 'Unknown error')
                    payment.save()
                    
                    order.status = 'DECLINED'
                    order.save()
                    
                    # Помечаем подписку как истекшую
                    user_product.status = 'expired'
                    user_product.save()
                    
                    failed_count += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f'   ❌ Ошибка списания: {result.get("Message", "Unknown")}'
                        )
                    )
                    self.stdout.write(
                        self.style.WARNING(
                            f'   ⚠️  Подписка отменена'
                        )
                    )
                    
                    logger.error(
                        f'Recurring payment failed: user={user.email}, '
                        f'product={product.name}, error={result.get("Message")}'
                    )
                    
                    # TODO: Отправить email пользователю о неудачном списании
                
            except Exception as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'   ❌ Исключение при обработке: {str(e)}'
                    )
                )
                logger.exception(
                    f'Exception processing recurring payment for user {user.email}: {e}'
                )
        
        # Итоговая статистика
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS(f'✅ Успешно: {success_count}'))
        self.stdout.write(self.style.ERROR(f'❌ Ошибок: {failed_count}'))
        if dry_run:
            self.stdout.write(self.style.WARNING(f'⏭️  Пропущено (dry-run): {skipped_count}'))
        self.stdout.write('=' * 60)

