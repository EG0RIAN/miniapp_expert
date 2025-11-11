"""
Управляющая команда для тестирования отправки всех типов email
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User
from apps.users.services import (
    send_verification_email,
    send_welcome_email,
    send_password_reset_email,
    send_subscription_reminder_email,
    generate_verification_token,
    generate_reset_token,
)
from apps.products.models import UserProduct


class Command(BaseCommand):
    help = 'Тестирует отправку всех типов email'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email для тестирования (по умолчанию используется тестовый email из настроек)',
        )

    def handle(self, *args, **options):
        test_email = options.get('email') or 'test@example.com'
        
        # Создаем или получаем тестового пользователя
        user, created = User.objects.get_or_create(
            email=test_email,
            defaults={
                'name': 'Test User',
                'phone': '+79999999999',
                'role': 'client',
                'is_active': True,
                'email_verified': False,
            }
        )
        
        self.stdout.write(self.style.SUCCESS(f'Тестирование отправки писем для: {user.email}'))
        self.stdout.write('=' * 60)
        
        # 1. Тест подтверждения email
        self.stdout.write('\n1. Тест подтверждения email...')
        try:
            token = generate_verification_token(user.email)
            if send_verification_email(user, token):
                self.stdout.write(self.style.SUCCESS('✓ Email подтверждения отправлен'))
            else:
                self.stdout.write(self.style.ERROR('✗ Ошибка отправки email подтверждения'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Ошибка: {str(e)}'))
        
        # 2. Тест welcome email
        self.stdout.write('\n2. Тест welcome email...')
        try:
            if send_welcome_email(user, order=None):
                self.stdout.write(self.style.SUCCESS('✓ Welcome email отправлен'))
            else:
                self.stdout.write(self.style.ERROR('✗ Ошибка отправки welcome email'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Ошибка: {str(e)}'))
        
        # 3. Тест восстановления пароля
        self.stdout.write('\n3. Тест восстановления пароля...')
        try:
            reset_token = generate_reset_token()
            user.reset_token = reset_token
            user.reset_token_expires_at = timezone.now() + timedelta(hours=24)
            user.save()
            if send_password_reset_email(user, reset_token):
                self.stdout.write(self.style.SUCCESS('✓ Email восстановления пароля отправлен'))
            else:
                self.stdout.write(self.style.ERROR('✗ Ошибка отправки email восстановления пароля'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Ошибка: {str(e)}'))
        
        # 4. Тест напоминания о подписке (если есть активная подписка)
        self.stdout.write('\n4. Тест напоминания о подписке...')
        try:
            user_products = UserProduct.objects.filter(
                user=user,
                status='active',
                product__product_type='subscription'
            ).select_related('product')[:1]
            
            if user_products.exists():
                user_product = user_products.first()
                if send_subscription_reminder_email(user, user_product, days_before=3):
                    self.stdout.write(self.style.SUCCESS(f'✓ Напоминание о подписке отправлено для: {user_product.product.name}'))
                else:
                    self.stdout.write(self.style.ERROR('✗ Ошибка отправки напоминания о подписке'))
            else:
                self.stdout.write(self.style.WARNING('⚠ Нет активных подписок для тестирования'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Ошибка: {str(e)}'))
        
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('Тестирование завершено!'))
        self.stdout.write(f'Проверьте почту: {test_email}')

