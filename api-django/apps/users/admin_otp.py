"""
OTP модель для админки Django
"""
from django.db import models
from django.utils import timezone
from datetime import timedelta
import random
import string


class AdminOTP(models.Model):
    """Модель для хранения OTP кодов для входа в админку"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='admin_otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'admin_otp'
        verbose_name = 'Admin OTP'
        verbose_name_plural = 'Admin OTPs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'code', 'used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"OTP for {self.user.email} - {self.code}"
    
    @classmethod
    def generate_code(cls):
        """Генерация 6-значного цифрового кода"""
        return ''.join(random.choices(string.digits, k=6))
    
    @classmethod
    def create_otp(cls, user, ip_address=None, expires_in_minutes=10):
        """Создание нового OTP кода"""
        # Инвалидируем все предыдущие неиспользованные OTP для этого пользователя
        cls.objects.filter(user=user, used=False).update(used=True, used_at=timezone.now())
        
        # Генерируем новый код
        code = cls.generate_code()
        expires_at = timezone.now() + timedelta(minutes=expires_in_minutes)
        
        otp = cls.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
            ip_address=ip_address,
        )
        return otp
    
    def is_valid(self):
        """Проверка валидности OTP кода"""
        if self.used:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True
    
    def mark_as_used(self):
        """Пометить OTP как использованный"""
        self.used = True
        self.used_at = timezone.now()
        self.save()
    
    @classmethod
    def verify_otp(cls, user, code):
        """Проверка OTP кода для пользователя"""
        try:
            otp = cls.objects.get(user=user, code=code, used=False)
            if otp.is_valid():
                otp.mark_as_used()
                return True
            return False
        except cls.DoesNotExist:
            return False

