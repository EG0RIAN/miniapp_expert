from django.db import models
from apps.users.models import User
from apps.products.models import Product
import uuid


class Order(models.Model):
    STATUS_CHOICES = [
        ('NEW', 'Новый'),
        ('FORM_SHOWED', 'Форма показана'),
        ('DEADLINE_EXPIRED', 'Срок истек'),
        ('CANCELED', 'Отменен'),
        ('PREAUTHORIZING', 'Предавторизация'),
        ('AUTHORIZING', 'Авторизация'),
        ('AUTHORIZED', 'Авторизован'),
        ('AUTH_FAIL', 'Ошибка авторизации'),
        ('REJECTED', 'Отклонен'),
        ('3DS_CHECKING', '3DS проверка'),
        ('3DS_CHECKED', '3DS проверен'),
        ('REVERSING', 'Возврат'),
        ('PARTIAL_REVERSED', 'Частичный возврат'),
        ('REVERSED', 'Возвращен'),
        ('CONFIRMED', 'Подтвержден'),
        ('REFUNDING', 'Возврат средств'),
        ('PARTIAL_REFUNDED', 'Частичный возврат'),
        ('REFUNDED', 'Возвращен'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.CharField(max_length=255, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='NEW')
    description = models.TextField(blank=True, null=True)
    
    # Customer info
    customer_name = models.CharField(max_length=255, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Payment info
    payment_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    payment_url = models.URLField(blank=True, null=True)
    subscription_agreed = models.BooleanField(default=False)
    subscription_agreed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'orders'
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_id']),
            models.Index(fields=['payment_id']),
            models.Index(fields=['status']),
            models.Index(fields=['customer_email']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Order {self.order_id} - {self.amount} {self.currency}"

