from django.db import models
from apps.users.models import User
from apps.orders.models import Order
import uuid


class Referral(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('active', 'Активен'),
        ('inactive', 'Неактивен'),
        ('cancelled', 'Отменен'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_given')
    referred_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00, help_text='Процент комиссии')
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    paid_out = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'referrals'
        verbose_name = 'Реферал'
        verbose_name_plural = 'Рефералы'
        ordering = ['-created_at']
        unique_together = [['referrer', 'referred_user']]
    
    def __str__(self):
        return f"{self.referrer.email} -> {self.referred_user.email}"


class ReferralPayout(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('processing', 'Обрабатывается'),
        ('paid', 'Выплачено'),
        ('failed', 'Ошибка'),
        ('cancelled', 'Отменено'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    payment_ref = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'referral_payouts'
        verbose_name = 'Выплата реферала'
        verbose_name_plural = 'Выплаты рефералов'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payout {self.id} - {self.amount} {self.currency}"


class ReferralCommission(models.Model):
    """Комиссия за конкретный заказ"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referral = models.ForeignKey(Referral, on_delete=models.CASCADE, related_name='commissions')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='referral_commissions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=ReferralPayout.STATUS_CHOICES, default='pending')
    payout = models.ForeignKey(ReferralPayout, on_delete=models.SET_NULL, null=True, blank=True, related_name='commissions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'referral_commissions'
        verbose_name = 'Комиссия реферала'
        verbose_name_plural = 'Комиссии рефералов'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Commission {self.id} - {self.commission_amount} {self.order.currency}"

