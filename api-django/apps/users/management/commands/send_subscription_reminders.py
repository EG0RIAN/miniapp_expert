"""
Управляющая команда для отправки напоминаний о предстоящем списании подписки
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.products.models import UserProduct
from apps.users.services import send_subscription_reminder_email


class Command(BaseCommand):
    help = 'Отправляет напоминания пользователям о предстоящем списании подписки'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-before',
            type=int,
            default=3,
            help='Количество дней до списания для отправки напоминания (по умолчанию: 3)',
        )

    def handle(self, *args, **options):
        days_before = options['days_before']
        target_date = timezone.now() + timedelta(days=days_before)
        
        # Находим все активные подписки, которые истекают через указанное количество дней
        user_products = UserProduct.objects.filter(
            status='active',
            product__product_type='subscription',
            end_date__date=target_date.date()
        ).select_related('user', 'product')
        
        self.stdout.write(f'Найдено {user_products.count()} подписок, истекающих через {days_before} дня(ей)')
        
        sent_count = 0
        error_count = 0
        
        for user_product in user_products:
            try:
                if send_subscription_reminder_email(user_product.user, user_product, days_before):
                    sent_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Напоминание отправлено: {user_product.user.email} - {user_product.product.name}'
                        )
                    )
                else:
                    error_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠ Не удалось отправить: {user_product.user.email} - {user_product.product.name}'
                        )
                    )
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Ошибка при отправке напоминания {user_product.user.email}: {str(e)}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nГотово! Отправлено: {sent_count}, Ошибок: {error_count}'
            )
        )

