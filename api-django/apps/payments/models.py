from django.db import models
from apps.users.models import User
from apps.orders.models import Order
import uuid


class PaymentMethod(models.Model):
    STATUS_CHOICES = [
        ('active', 'Активна'),
        ('expired', 'Истекла'),
        ('revoked', 'Отозвана'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    provider = models.CharField(max_length=50, default='tbank')
    rebill_id = models.CharField(max_length=255, unique=True, db_index=True)
    pan_mask = models.CharField(max_length=20)
    exp_date = models.CharField(max_length=10, blank=True, null=True)
    card_type = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_methods'
        verbose_name = 'Платежный метод'
        verbose_name_plural = 'Платежные методы'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.pan_mask}"


class Mandate(models.Model):
    TYPE_CHOICES = [
        ('rko', 'РКО'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Активен'),
        ('revoked', 'Отозван'),
        ('expired', 'Истек'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mandates')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='rko')
    bank = models.CharField(max_length=50, default='tinkoff')
    mandate_number = models.CharField(max_length=255, unique=True, db_index=True)
    signed_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    file_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mandates'
        verbose_name = 'Мандат'
        verbose_name_plural = 'Мандаты'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.mandate_number}"


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('processing', 'Обрабатывается'),
        ('success', 'Успешно'),
        ('failed', 'Неудачно'),
        ('cancelled', 'Отменен'),
        ('refunded', 'Возвращен'),
    ]
    
    METHOD_CHOICES = [
        ('card', 'Карта'),
        ('mit', 'MIT'),
        ('rko', 'РКО'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='card')
    provider_ref = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    failure_reason = models.TextField(blank=True, null=True)
    receipt_url = models.URLField(blank=True, null=True)
    purpose = models.CharField(max_length=50, blank=True, null=True, help_text='Например: card_binding, purchase')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Платеж'
        verbose_name_plural = 'Платежи'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['method']),
            models.Index(fields=['provider_ref']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency}"


class ManualCharge(models.Model):
    CHANNEL_CHOICES = [
        ('tinkoff_mit', 'T-Bank MIT'),
        ('tinkoff_rko', 'T-Bank РКО'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('processing', 'Обрабатывается'),
        ('success', 'Успешно'),
        ('failed', 'Неудачно'),
        ('cancelled', 'Отменен'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='manual_charges')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')
    reason = models.TextField()
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    provider_ref = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    failure_reason = models.TextField(blank=True, null=True)
    initiator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='initiated_charges')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True, related_name='manual_charges')
    mandate = models.ForeignKey(Mandate, on_delete=models.SET_NULL, null=True, blank=True, related_name='manual_charges')
    idempotency_key = models.CharField(max_length=255, unique=True, blank=True, null=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'manual_charges'
        verbose_name = 'Ручное списание'
        verbose_name_plural = 'Ручные списания'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['channel']),
            models.Index(fields=['provider_ref']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Manual Charge {self.id} - {self.amount} {self.currency}"


class Transaction(models.Model):
    """Общая модель для всех транзакций (платежи, списания, возвраты)"""
    TYPE_CHOICES = [
        ('payment', 'Платеж'),
        ('charge', 'Списание'),
        ('refund', 'Возврат'),
        ('manual_charge', 'Ручное списание'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    manual_charge = models.ForeignKey(ManualCharge, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')
    description = models.TextField(blank=True, null=True)
    provider_ref = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'transactions'
        verbose_name = 'Транзакция'
        verbose_name_plural = 'Транзакции'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_type']),
            models.Index(fields=['provider_ref']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Transaction {self.id} - {self.amount} {self.currency}"

