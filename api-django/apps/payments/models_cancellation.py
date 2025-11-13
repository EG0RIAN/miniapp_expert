"""
Модель для запросов на отмену подписки через реферала
"""
from django.db import models
from django.utils import timezone
from datetime import timedelta


class CancellationRequest(models.Model):
    """Запрос на отмену подписки от пользователя"""
    
    STATUS_CHOICES = [
        ('pending', 'Ожидает решения'),
        ('approved', 'Одобрено (подписка отменена)'),
        ('rejected', 'Отклонено (подписка сохранена)'),
        ('expired', 'Истекло (автоматически отменено)'),
    ]
    
    # Основные поля
    user_product = models.ForeignKey(
        'products.UserProduct',
        on_delete=models.CASCADE,
        related_name='cancellation_requests',
        verbose_name='Подписка пользователя'
    )
    
    # Кто запросил отмену
    requested_by = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='my_cancellation_requests',
        verbose_name='Пользователь'
    )
    
    # Кто должен принять решение (реферал)
    referrer = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referral_cancellation_requests',
        verbose_name='Реферал (принимает решение)'
    )
    
    # Статус и причина
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    
    cancellation_reason = models.TextField(
        blank=True,
        verbose_name='Причина отмены'
    )
    
    # Кто принял решение и когда
    decided_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='decided_cancellation_requests',
        verbose_name='Кто принял решение'
    )
    
    decided_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата решения'
    )
    
    decision_comment = models.TextField(
        blank=True,
        verbose_name='Комментарий к решению'
    )
    
    # Даты
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    expires_at = models.DateTimeField(
        verbose_name='Истекает'
    )
    
    # Уведомления
    referrer_notified = models.BooleanField(
        default=False,
        verbose_name='Реферал уведомлен'
    )
    
    reminder_sent = models.BooleanField(
        default=False,
        verbose_name='Напоминание отправлено'
    )
    
    class Meta:
        db_table = 'cancellation_requests'
        verbose_name = 'Запрос на отмену подписки'
        verbose_name_plural = 'Запросы на отмену подписок'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'expires_at']),
            models.Index(fields=['referrer', 'status']),
            models.Index(fields=['requested_by']),
        ]
    
    def __str__(self):
        return f"Запрос #{self.id} от {self.requested_by.email} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Автоматически установить expires_at если не задано
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Истек ли срок принятия решения"""
        return timezone.now() > self.expires_at and self.status == 'pending'
    
    @property
    def time_left(self):
        """Сколько времени осталось до истечения"""
        if self.status != 'pending':
            return None
        delta = self.expires_at - timezone.now()
        if delta.total_seconds() <= 0:
            return "Истекло"
        
        hours = int(delta.total_seconds() // 3600)
        minutes = int((delta.total_seconds() % 3600) // 60)
        
        if hours > 0:
            return f"{hours} ч {minutes} мин"
        return f"{minutes} мин"
    
    def approve(self, user, comment=''):
        """Одобрить отмену (отменить подписку)"""
        self.status = 'approved'
        self.decided_by = user
        self.decided_at = timezone.now()
        self.decision_comment = comment
        self.save()
        
        # Отменить подписку
        self.user_product.status = 'cancelled'
        self.user_product.save()
    
    def reject(self, user, comment=''):
        """Отклонить отмену (сохранить подписку)"""
        self.status = 'rejected'
        self.decided_by = user
        self.decided_at = timezone.now()
        self.decision_comment = comment
        self.save()
    
    def expire(self):
        """Истечение срока - автоматическая отмена"""
        self.status = 'expired'
        self.decided_at = timezone.now()
        self.decision_comment = 'Автоматически отменено (истек срок принятия решения)'
        self.save()
        
        # Отменить подписку
        self.user_product.status = 'cancelled'
        self.user_product.save()

