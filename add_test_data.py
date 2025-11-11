#!/usr/bin/env python
"""
Script to add test data for user e.arkhiptsev1@gmail.com
"""
import os
import sys
import django
from pathlib import Path

# Add project directory to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / 'api-django'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'miniapp_api.settings')
django.setup()

from apps.users.models import User
from apps.products.models import Product, UserProduct
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.affiliates.models import Referral, ReferralCommission
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
import uuid

def add_test_data():
    # Get user
    user = User.objects.filter(email='e.arkhiptsev1@gmail.com').first()
    if not user:
        print(f'❌ User e.arkhiptsev1@gmail.com not found')
        return
    
    print(f'✅ User found: {user.email}')
    
    # Create or get products
    real_estate_product, created = Product.objects.get_or_create(
        slug='real-estate-miniapp',
        defaults={
            'name': 'Mini App для агентств недвижимости',
            'description': 'Полнофункциональное приложение для риэлторов: каталог объектов, фильтры, избранное, запись на просмотр, чат с менеджером.',
            'price': Decimal('5000.00'),
            'currency': 'RUB',
            'product_type': 'subscription',
            'subscription_period': 'monthly',
            'is_active': True,
        }
    )
    if created:
        print(f'✅ Created product: {real_estate_product.name}')
    else:
        print(f'✅ Product exists: {real_estate_product.name}')
    
    # Create UserProduct (active subscription)
    user_product, created = UserProduct.objects.get_or_create(
        user=user,
        product=real_estate_product,
        defaults={
            'status': 'active',
            'start_date': timezone.now() - timedelta(days=30),
            'end_date': timezone.now() + timedelta(days=30),
            'renewal_price': Decimal('5000.00'),
        }
    )
    if created:
        print(f'✅ Created UserProduct: {user_product.product.name} (status: {user_product.status})')
    else:
        print(f'✅ UserProduct exists: {user_product.product.name}')
        # Update to active if not active
        if user_product.status != 'active':
            user_product.status = 'active'
            user_product.start_date = timezone.now() - timedelta(days=30)
            user_product.end_date = timezone.now() + timedelta(days=30)
            user_product.save()
            print(f'✅ Updated UserProduct to active')
    
    # Create Order
    order_id = f'ORDER-{uuid.uuid4().hex[:8].upper()}'
    order, created = Order.objects.get_or_create(
        order_id=order_id,
        defaults={
            'user': user,
            'product': real_estate_product,
            'status': 'CONFIRMED',
            'amount': Decimal('5000.00'),
            'currency': 'RUB',
            'description': f'Подписка на {real_estate_product.name}',
            'customer_name': user.name,
            'customer_email': user.email,
            'customer_phone': user.phone,
        }
    )
    if created:
        print(f'✅ Created Order: {order.description}')
    else:
        print(f'✅ Order exists: {order.description}')
    
    # Create Payment (successful)
    payment_provider_ref = f'TEST-{uuid.uuid4().hex[:8].upper()}'
    payment, created = Payment.objects.get_or_create(
        order=order,
        provider_ref=payment_provider_ref,
        defaults={
            'user': user,
            'amount': Decimal('5000.00'),
            'currency': 'RUB',
            'status': 'success',
            'method': 'card',
        }
    )
    if created:
        print(f'✅ Created Payment: {payment.amount} {payment.currency} (status: {payment.status})')
    else:
        print(f'✅ Payment exists: {payment.amount} {payment.currency}')
    
    # Create another payment (historical) - need another order
    order_id2 = f'ORDER-{uuid.uuid4().hex[:8].upper()}'
    order2, created2 = Order.objects.get_or_create(
        order_id=order_id2,
        defaults={
            'user': user,
            'product': real_estate_product,
            'status': 'CONFIRMED',
            'amount': Decimal('3000.00'),
            'currency': 'RUB',
            'description': f'Подписка на {real_estate_product.name}',
            'customer_name': user.name,
            'customer_email': user.email,
            'customer_phone': user.phone,
            'created_at': timezone.now() - timedelta(days=60),
        }
    )
    if created2:
        print(f'✅ Created historical Order: {order2.order_id}')
    
    payment_provider_ref2 = f'TEST-{uuid.uuid4().hex[:8].upper()}'
    payment2, created = Payment.objects.get_or_create(
        order=order2,
        provider_ref=payment_provider_ref2,
        defaults={
            'user': user,
            'amount': Decimal('3000.00'),
            'currency': 'RUB',
            'status': 'success',
            'method': 'card',
            'created_at': timezone.now() - timedelta(days=60),
        }
    )
    if created:
        print(f'✅ Created historical Payment: {payment2.amount} {payment.currency}')
    
    # Create referral data (if user has referral_code)
    if user.referral_code:
        # Create a referred user
        referred_user, created = User.objects.get_or_create(
            email='referred@example.com',
            defaults={
                'name': 'Referred User',
                'role': 'client',
                'is_active': True,
                'referred_by': user,
            }
        )
        if created:
            print(f'✅ Created referred user: {referred_user.email}')
        
        # Create referral
        referral, created = Referral.objects.get_or_create(
            referrer=user,
            referred_user=referred_user,
            defaults={
                'status': 'active',
                'commission_rate': Decimal('20.00'),
            }
        )
        if created:
            print(f'✅ Created Referral: {referral.referrer.email} -> {referral.referred_user.email}')
        
        # Create referral commission
        if order and order.status == 'CONFIRMED':
            commission, created = ReferralCommission.objects.get_or_create(
                referral=referral,
                order=order,
                defaults={
                    'amount': order.amount,
                    'commission_rate': Decimal('20.00'),
                    'commission_amount': order.amount * Decimal('0.20'),
                    'status': 'pending',
                }
            )
            if created:
                print(f'✅ Created ReferralCommission: {commission.commission_amount} {order.currency}')
    
    # Summary
    print('\n📊 Summary:')
    print(f'  - UserProducts: {UserProduct.objects.filter(user=user).count()}')
    print(f'  - Orders: {Order.objects.filter(user=user).count()}')
    print(f'  - Payments: {Payment.objects.filter(user=user).count()}')
    print(f'  - Referrals: {Referral.objects.filter(referrer=user).count()}')
    print(f'  - ReferralCommissions: {ReferralCommission.objects.filter(referral__referrer=user).count()}')
    
    print('\n✅ Test data added successfully!')

if __name__ == '__main__':
    add_test_data()

