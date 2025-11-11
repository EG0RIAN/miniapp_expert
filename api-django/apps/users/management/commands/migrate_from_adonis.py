"""
Django management command для миграции данных из AdonisJS в Django
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.users.models import User
from apps.products.models import Product, UserProduct
from apps.orders.models import Order
from apps.payments.models import Payment, PaymentMethod, ManualCharge, Mandate, Transaction
from apps.affiliates.models import Referral, ReferralPayout, ReferralCommission
from apps.audit.models import AuditLog
import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal
from datetime import datetime
import uuid


class Command(BaseCommand):
    help = 'Миграция данных из AdonisJS в Django'

    def add_arguments(self, parser):
        parser.add_argument(
            '--old-db-host',
            type=str,
            default='localhost',
            help='Host старой БД AdonisJS'
        )
        parser.add_argument(
            '--old-db-port',
            type=int,
            default=5432,
            help='Port старой БД AdonisJS'
        )
        parser.add_argument(
            '--old-db-name',
            type=str,
            required=True,
            help='Имя старой БД AdonisJS'
        )
        parser.add_argument(
            '--old-db-user',
            type=str,
            required=True,
            help='Пользователь старой БД AdonisJS'
        )
        parser.add_argument(
            '--old-db-password',
            type=str,
            required=True,
            help='Пароль старой БД AdonisJS'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Пробный запуск без сохранения данных'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Начало миграции данных из AdonisJS...'))
        
        # Подключение к старой БД
        try:
            old_conn = psycopg2.connect(
                host=options['old_db_host'],
                port=options['old_db_port'],
                database=options['old_db_name'],
                user=options['old_db_user'],
                password=options['old_db_password']
            )
            old_cursor = old_conn.cursor(cursor_factory=RealDictCursor)
            self.stdout.write(self.style.SUCCESS('Подключено к старой БД'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка подключения к старой БД: {e}'))
            return

        dry_run = options['dry_run']
        
        try:
            with transaction.atomic():
                # Миграция пользователей
                self.migrate_users(old_cursor, dry_run)
                
                # Миграция продуктов (если есть в старой БД)
                self.migrate_products(old_cursor, dry_run)
                
                # Миграция заказов (из PocketBase или старой БД)
                self.migrate_orders(old_cursor, dry_run)
                
                # Миграция платежей
                self.migrate_payments(old_cursor, dry_run)
                
                # Миграция платежных методов
                self.migrate_payment_methods(old_cursor, dry_run)
                
                # Миграция мандатов
                self.migrate_mandates(old_cursor, dry_run)
                
                # Миграция ручных списаний
                self.migrate_manual_charges(old_cursor, dry_run)
                
                # Миграция рефералов
                self.migrate_referrals(old_cursor, dry_run)
                
                # Миграция аудита
                self.migrate_audit_logs(old_cursor, dry_run)
                
                if dry_run:
                    transaction.set_rollback(True)
                    self.stdout.write(self.style.WARNING('ПРОБНЫЙ ЗАПУСК - данные не сохранены'))
                else:
                    self.stdout.write(self.style.SUCCESS('Миграция завершена успешно!'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка миграции: {e}'))
            import traceback
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
        finally:
            old_cursor.close()
            old_conn.close()

    def migrate_users(self, cursor, dry_run):
        """Миграция пользователей"""
        self.stdout.write('Миграция пользователей...')
        
        cursor.execute("""
            SELECT id, name, email, password, role, email_verified, 
                   verification_token, reset_token, reset_token_expires_at,
                   offer_accepted_at, offer_version, telegram_id, 
                   referral_code, referred_by, created_at, updated_at
            FROM users
            ORDER BY id
        """)
        
        users = cursor.fetchall()
        migrated_count = 0
        
        user_id_map = {}  # Маппинг старых ID на новые
        
        # Сначала создаем всех пользователей без referred_by
        for old_user in users:
            if old_user['referred_by']:
                continue  # Пропускаем пользователей с referred_by, обработаем их позже
            try:
                # Проверяем, существует ли пользователь
                if User.objects.filter(email=old_user['email']).exists():
                    existing_user = User.objects.get(email=old_user['email'])
                    user_id_map[old_user['id']] = existing_user.id
                    self.stdout.write(f'  Пользователь {old_user["email"]} уже существует, пропускаем')
                    continue
                
                # Находим referred_by пользователя
                referred_by_user = None
                if old_user['referred_by'] and old_user['referred_by'] in user_id_map:
                    try:
                        referred_by_user = User.objects.get(id=user_id_map[old_user['referred_by']])
                    except User.DoesNotExist:
                        pass
                
                user = User(
                    id=old_user['id'],  # Сохраняем старый ID
                    email=old_user['email'],
                    name=old_user['name'],
                    password=old_user['password'],  # Пароль уже захеширован
                    role=old_user['role'] or 'client',
                    email_verified=old_user['email_verified'] or False,
                    verification_token=old_user['verification_token'],
                    reset_token=old_user['reset_token'],
                    reset_token_expires_at=old_user['reset_token_expires_at'],
                    offer_accepted_at=old_user['offer_accepted_at'],
                    offer_version=old_user['offer_version'],
                    telegram_id=old_user['telegram_id'],
                    referral_code=old_user['referral_code'],
                    referred_by=referred_by_user,
                    created_at=old_user['created_at'] or timezone.now(),
                    updated_at=old_user['updated_at'] or timezone.now(),
                )
                
                if not dry_run:
                    user.save()
                    user_id_map[old_user['id']] = user.id
                
                migrated_count += 1
                self.stdout.write(f'  Мигрирован пользователь: {old_user["email"]}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции пользователя {old_user["email"]}: {e}'))
        
        # Теперь обрабатываем пользователей с referred_by
        for old_user in users:
            if not old_user['referred_by']:
                continue  # Уже обработали
            
            try:
                if User.objects.filter(email=old_user['email']).exists():
                    existing_user = User.objects.get(email=old_user['email'])
                    user_id_map[old_user['id']] = existing_user.id
                    continue
                
                referred_by_user = None
                if old_user['referred_by'] in user_id_map:
                    try:
                        referred_by_user = User.objects.get(id=user_id_map[old_user['referred_by']])
                    except User.DoesNotExist:
                        pass
                
                user = User(
                    id=old_user['id'],
                    email=old_user['email'],
                    name=old_user['name'],
                    password=old_user['password'],
                    role=old_user['role'] or 'client',
                    email_verified=old_user['email_verified'] or False,
                    verification_token=old_user['verification_token'],
                    reset_token=old_user['reset_token'],
                    reset_token_expires_at=old_user['reset_token_expires_at'],
                    offer_accepted_at=old_user['offer_accepted_at'],
                    offer_version=old_user['offer_version'],
                    telegram_id=old_user['telegram_id'],
                    referral_code=old_user['referral_code'],
                    referred_by=referred_by_user,
                    created_at=old_user['created_at'] or timezone.now(),
                    updated_at=old_user['updated_at'] or timezone.now(),
                )
                
                if not dry_run:
                    user.save()
                    user_id_map[old_user['id']] = user.id
                
                migrated_count += 1
                self.stdout.write(f'  Мигрирован пользователь с рефералом: {old_user["email"]}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции пользователя {old_user["email"]}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано пользователей: {migrated_count}'))
        return user_id_map

    def migrate_products(self, cursor, dry_run):
        """Миграция продуктов"""
        self.stdout.write('Миграция продуктов...')
        
        # Проверяем, есть ли таблица products в старой БД
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'products'
        """)
        
        if not cursor.fetchone():
            self.stdout.write('  Таблица products не найдена в старой БД, пропускаем')
            return
        
        cursor.execute("""
            SELECT id, name, description, slug, price, currency, 
                   product_type, subscription_period, is_active,
                   created_at, updated_at
            FROM products
            ORDER BY id
        """)
        
        products = cursor.fetchall()
        migrated_count = 0
        
        for old_product in products:
            try:
                product = Product(
                    id=old_product['id'],
                    name=old_product['name'],
                    description=old_product.get('description'),
                    slug=old_product.get('slug', old_product['name'].lower().replace(' ', '-')),
                    price=Decimal(str(old_product['price'])) if old_product['price'] else Decimal('0'),
                    currency=old_product.get('currency', 'RUB'),
                    product_type=old_product.get('product_type', 'one_time'),
                    subscription_period=old_product.get('subscription_period'),
                    is_active=old_product.get('is_active', True),
                    created_at=old_product.get('created_at') or timezone.now(),
                    updated_at=old_product.get('updated_at') or timezone.now(),
                )
                
                if not dry_run:
                    product.save()
                
                migrated_count += 1
                self.stdout.write(f'  Мигрирован продукт: {old_product["name"]}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции продукта {old_product["name"]}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано продуктов: {migrated_count}'))

    def migrate_orders(self, cursor, dry_run):
        """Миграция заказов"""
        self.stdout.write('Миграция заказов...')
        
        # Проверяем, есть ли таблица orders в старой БД
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'orders'
        """)
        
        if not cursor.fetchone():
            self.stdout.write('  Таблица orders не найдена в старой БД (возможно в PocketBase), пропускаем')
            return
        
        cursor.execute("""
            SELECT id, order_id, user_id, product_id, amount, currency, status,
                   description, customer_name, customer_email, customer_phone,
                   payment_id, payment_url, subscription_agreed, subscription_agreed_at,
                   created_at, updated_at
            FROM orders
            ORDER BY created_at
        """)
        
        orders = cursor.fetchall()
        migrated_count = 0
        
        for old_order in orders:
            try:
                user = None
                if old_order['user_id']:
                    try:
                        user = User.objects.get(id=old_order['user_id'])
                    except User.DoesNotExist:
                        pass
                
                product = None
                if old_order['product_id']:
                    try:
                        product = Product.objects.get(id=old_order['product_id'])
                    except Product.DoesNotExist:
                        pass
                
                order = Order(
                    id=old_order.get('id') or uuid.uuid4(),
                    order_id=old_order['order_id'],
                    user=user,
                    product=product,
                    amount=Decimal(str(old_order['amount'])) if old_order['amount'] else Decimal('0'),
                    currency=old_order.get('currency', 'RUB'),
                    status=old_order.get('status', 'NEW'),
                    description=old_order.get('description'),
                    customer_name=old_order.get('customer_name'),
                    customer_email=old_order.get('customer_email'),
                    customer_phone=old_order.get('customer_phone'),
                    payment_id=old_order.get('payment_id'),
                    payment_url=old_order.get('payment_url'),
                    subscription_agreed=old_order.get('subscription_agreed', False),
                    subscription_agreed_at=old_order.get('subscription_agreed_at'),
                    created_at=old_order.get('created_at') or timezone.now(),
                    updated_at=old_order.get('updated_at') or timezone.now(),
                )
                
                if not dry_run:
                    order.save()
                
                migrated_count += 1
                self.stdout.write(f'  Мигрирован заказ: {old_order["order_id"]}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции заказа {old_order["order_id"]}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано заказов: {migrated_count}'))

    def migrate_payments(self, cursor, dry_run):
        """Миграция платежей"""
        self.stdout.write('Миграция платежей...')
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payments'
        """)
        
        if not cursor.fetchone():
            self.stdout.write('  Таблица payments не найдена в старой БД, пропускаем')
            return
        
        cursor.execute("""
            SELECT id, order_id, user_id, amount, currency, status, method,
                   provider_ref, failure_reason, receipt_url,
                   created_at, updated_at
            FROM payments
            ORDER BY created_at
        """)
        
        payments = cursor.fetchall()
        migrated_count = 0
        
        for old_payment in payments:
            try:
                order = None
                if old_payment['order_id']:
                    try:
                        order = Order.objects.get(order_id=old_payment['order_id'])
                    except Order.DoesNotExist:
                        pass
                
                user = None
                if old_payment['user_id']:
                    try:
                        user = User.objects.get(id=old_payment['user_id'])
                    except User.DoesNotExist:
                        pass
                
                payment = Payment(
                    id=old_payment.get('id') or uuid.uuid4(),
                    order=order,
                    user=user,
                    amount=Decimal(str(old_payment['amount'])) if old_payment['amount'] else Decimal('0'),
                    currency=old_payment.get('currency', 'RUB'),
                    status=old_payment.get('status', 'pending'),
                    method=old_payment.get('method', 'card'),
                    provider_ref=old_payment.get('provider_ref'),
                    failure_reason=old_payment.get('failure_reason'),
                    receipt_url=old_payment.get('receipt_url'),
                    created_at=old_payment.get('created_at') or timezone.now(),
                    updated_at=old_payment.get('updated_at') or timezone.now(),
                )
                
                if not dry_run:
                    payment.save()
                
                migrated_count += 1
                self.stdout.write(f'  Мигрирован платеж: {old_payment["id"]}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции платежа: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано платежей: {migrated_count}'))

    def migrate_payment_methods(self, cursor, dry_run):
        """Миграция платежных методов"""
        self.stdout.write('Миграция платежных методов...')
        
        cursor.execute("""
            SELECT id, customer_email, provider, rebill_id, pan_mask, exp_date,
                   card_type, status, is_default, created_at, updated_at
            FROM payment_methods
            ORDER BY created_at
        """)
        
        payment_methods = cursor.fetchall()
        migrated_count = 0
        
        for old_pm in payment_methods:
            try:
                user = None
                if old_pm['customer_email']:
                    try:
                        user = User.objects.get(email=old_pm['customer_email'])
                    except User.DoesNotExist:
                        pass
                
                if not user:
                    self.stdout.write(f'  Пользователь {old_pm["customer_email"]} не найден, пропускаем')
                    continue
                
                payment_method = PaymentMethod(
                    id=old_pm.get('id') or uuid.uuid4(),
                    user=user,
                    provider=old_pm.get('provider', 'tinkoff'),
                    rebill_id=old_pm['rebill_id'],
                    pan_mask=old_pm['pan_mask'],
                    exp_date=old_pm.get('exp_date'),
                    card_type=old_pm.get('card_type'),
                    status=old_pm.get('status', 'active'),
                    is_default=old_pm.get('is_default', False),
                    created_at=old_pm.get('created_at') or timezone.now(),
                    updated_at=old_pm.get('updated_at') or timezone.now(),
                )
                
                if not dry_run:
                    payment_method.save()
                
                migrated_count += 1
                self.stdout.write(f'  Мигрирован платежный метод: {old_pm["pan_mask"]}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции платежного метода: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано платежных методов: {migrated_count}'))

    def migrate_mandates(self, cursor, dry_run):
        """Миграция мандатов"""
        self.stdout.write('Миграция мандатов...')
        
        cursor.execute("""
            SELECT id, customer_email, type, bank, mandate_number, signed_at,
                   status, file_url, notes, created_at, updated_at
            FROM mandates
            ORDER BY created_at
        """)
        
        mandates = cursor.fetchall()
        migrated_count = 0
        
        for old_mandate in mandates:
            try:
                user = None
                if old_mandate['customer_email']:
                    try:
                        user = User.objects.get(email=old_mandate['customer_email'])
                    except User.DoesNotExist:
                        pass
                
                if not user:
                    self.stdout.write(f'  Пользователь {old_mandate["customer_email"]} не найден, пропускаем')
                    continue
                
                mandate = Mandate(
                    id=old_mandate.get('id') or uuid.uuid4(),
                    user=user,
                    type=old_mandate.get('type', 'rko'),
                    bank=old_mandate.get('bank', 'tinkoff'),
                    mandate_number=old_mandate['mandate_number'],
                    signed_at=old_mandate.get('signed_at'),
                    status=old_mandate.get('status', 'active'),
                    file_url=old_mandate.get('file_url'),
                    notes=old_mandate.get('notes'),
                    created_at=old_mandate.get('created_at') or timezone.now(),
                    updated_at=old_mandate.get('updated_at') or timezone.now(),
                )
                
                if not dry_run:
                    mandate.save()
                
                migrated_count += 1
                self.stdout.write(f'  Мигрирован мандат: {old_mandate["mandate_number"]}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции мандата: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано мандатов: {migrated_count}'))

    def migrate_manual_charges(self, cursor, dry_run):
        """Миграция ручных списаний"""
        self.stdout.write('Миграция ручных списаний...')
        
        cursor.execute("""
            SELECT id, customer_email, amount, currency, reason, channel, status,
                   provider_ref, failure_reason, initiator_email, payment_method_id,
                   mandate_id, idempotency_key, processed_at, created_at, updated_at
            FROM manual_charges
            ORDER BY created_at
        """)
        
        manual_charges = cursor.fetchall()
        migrated_count = 0
        
        for old_charge in manual_charges:
            try:
                user = None
                if old_charge['customer_email']:
                    try:
                        user = User.objects.get(email=old_charge['customer_email'])
                    except User.DoesNotExist:
                        pass
                
                if not user:
                    self.stdout.write(f'  Пользователь {old_charge["customer_email"]} не найден, пропускаем')
                    continue
                
                initiator = None
                if old_charge['initiator_email']:
                    try:
                        initiator = User.objects.get(email=old_charge['initiator_email'])
                    except User.DoesNotExist:
                        pass
                
                payment_method = None
                if old_charge['payment_method_id']:
                    try:
                        payment_method = PaymentMethod.objects.get(id=old_charge['payment_method_id'])
                    except PaymentMethod.DoesNotExist:
                        pass
                
                mandate = None
                if old_charge['mandate_id']:
                    try:
                        mandate = Mandate.objects.get(id=old_charge['mandate_id'])
                    except Mandate.DoesNotExist:
                        pass
                
                manual_charge = ManualCharge(
                    id=old_charge.get('id') or uuid.uuid4(),
                    user=user,
                    amount=Decimal(str(old_charge['amount'])) if old_charge['amount'] else Decimal('0'),
                    currency=old_charge.get('currency', 'RUB'),
                    reason=old_charge['reason'],
                    channel=old_charge['channel'],
                    status=old_charge.get('status', 'pending'),
                    provider_ref=old_charge.get('provider_ref'),
                    failure_reason=old_charge.get('failure_reason'),
                    initiator=initiator,
                    payment_method=payment_method,
                    mandate=mandate,
                    idempotency_key=old_charge.get('idempotency_key'),
                    processed_at=old_charge.get('processed_at'),
                    created_at=old_charge.get('created_at') or timezone.now(),
                    updated_at=old_charge.get('updated_at') or timezone.now(),
                )
                
                if not dry_run:
                    manual_charge.save()
                
                migrated_count += 1
                self.stdout.write(f'  Мигрировано ручное списание: {old_charge["id"]}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции ручного списания: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано ручных списаний: {migrated_count}'))

    def migrate_referrals(self, cursor, dry_run):
        """Миграция рефералов"""
        self.stdout.write('Миграция рефералов...')
        
        # Рефералы уже есть в таблице users (referred_by), но если есть отдельная таблица
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'referrals'
        """)
        
        if not cursor.fetchone():
            self.stdout.write('  Таблица referrals не найдена (рефералы в users.referred_by), пропускаем')
            return
        
        cursor.execute("""
            SELECT id, referrer_id, referred_user_id, status, commission_rate,
                   total_earned, paid_out, created_at, updated_at
            FROM referrals
            ORDER BY created_at
        """)
        
        referrals = cursor.fetchall()
        migrated_count = 0
        
        for old_referral in referrals:
            try:
                referrer = None
                if old_referral['referrer_id']:
                    try:
                        referrer = User.objects.get(id=old_referral['referrer_id'])
                    except User.DoesNotExist:
                        pass
                
                referred_user = None
                if old_referral['referred_user_id']:
                    try:
                        referred_user = User.objects.get(id=old_referral['referred_user_id'])
                    except User.DoesNotExist:
                        pass
                
                if not referrer or not referred_user:
                    self.stdout.write(f'  Реферал не найден, пропускаем')
                    continue
                
                referral = Referral(
                    id=old_referral.get('id') or uuid.uuid4(),
                    referrer=referrer,
                    referred_user=referred_user,
                    status=old_referral.get('status', 'pending'),
                    commission_rate=Decimal(str(old_referral.get('commission_rate', 10))),
                    total_earned=Decimal(str(old_referral.get('total_earned', 0))),
                    paid_out=Decimal(str(old_referral.get('paid_out', 0))),
                    created_at=old_referral.get('created_at') or timezone.now(),
                    updated_at=old_referral.get('updated_at') or timezone.now(),
                )
                
                if not dry_run:
                    referral.save()
                
                migrated_count += 1
                self.stdout.write(f'  Мигрирован реферал: {referrer.email} -> {referred_user.email}')
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции реферала: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано рефералов: {migrated_count}'))

    def migrate_audit_logs(self, cursor, dry_run):
        """Миграция журнала аудита"""
        self.stdout.write('Миграция журнала аудита...')
        
        cursor.execute("""
            SELECT id, entity, entity_id, action, actor_email, actor_role,
                   before, after, ip_address, user_agent, created_at
            FROM audit_logs
            ORDER BY created_at
        """)
        
        audit_logs = cursor.fetchall()
        migrated_count = 0
        
        for old_log in audit_logs:
            try:
                actor = None
                if old_log['actor_email']:
                    try:
                        actor = User.objects.get(email=old_log['actor_email'])
                    except User.DoesNotExist:
                        pass
                
                audit_log = AuditLog(
                    id=old_log.get('id') or uuid.uuid4(),
                    entity_type=old_log['entity'],
                    entity_id=str(old_log['entity_id']),
                    action=old_log['action'],
                    actor=actor,
                    actor_email=old_log['actor_email'],
                    actor_role=old_log.get('actor_role'),
                    before=old_log.get('before'),
                    after=old_log.get('after'),
                    ip_address=old_log.get('ip_address'),
                    user_agent=old_log.get('user_agent'),
                    created_at=old_log.get('created_at') or timezone.now(),
                )
                
                if not dry_run:
                    audit_log.save()
                
                migrated_count += 1
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Ошибка миграции аудит-лога: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'Мигрировано аудит-логов: {migrated_count}'))

