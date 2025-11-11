from django.db import models
from apps.users.models import User
import uuid


class Product(models.Model):
    PRODUCT_TYPE_CHOICES = [
        ('one_time', 'Разовая покупка'),
        ('subscription', 'Подписка'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES, default='one_time')
    subscription_period = models.CharField(max_length=20, blank=True, null=True, help_text='monthly, yearly')
    subscription_terms = models.ForeignKey(
        'documents.Document',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        limit_choices_to={'document_type': 'subscription_terms', 'is_active': True},
        help_text='Условия подписки для данного продукта (если продукт является подпиской)'
    )
    app_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL приложения',
        help_text='Ссылка на приложение (Mini App)'
    )
    admin_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL админки',
        help_text='Ссылка на админ-панель продукта'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        verbose_name = 'Продукт'
        verbose_name_plural = 'Продукты'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class UserProduct(models.Model):
    STATUS_CHOICES = [
        ('active', 'Активен'),
        ('expired', 'Истек'),
        ('pending', 'Ожидает'),
        ('cancelled', 'Отменен'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='user_products')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    renewal_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    payment_method = models.ForeignKey('payments.PaymentMethod', on_delete=models.SET_NULL, null=True, blank=True, related_name='user_products', help_text='Платежный метод для автоматического списания подписки')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_products'
        verbose_name = 'Продукт пользователя'
        verbose_name_plural = 'Продукты пользователей'
        ordering = ['-created_at']
        unique_together = [['user', 'product', 'status']]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name}"

