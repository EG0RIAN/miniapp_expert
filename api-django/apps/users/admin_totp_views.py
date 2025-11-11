"""
Views для настройки TOTP (Google Authenticator) в админке
"""
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.http import JsonResponse
from .models import User
from .totp_services import (
    generate_totp_secret, get_totp_uri, generate_qr_code,
    verify_totp_code, enable_totp, disable_totp
)


@method_decorator(staff_member_required, name='dispatch')
class SetupTOTPView(View):
    """Настройка TOTP (Google Authenticator) для пользователя"""
    
    def get(self, request):
        user = request.user
        
        # Если TOTP уже настроен, показываем информацию
        if user.totp_enabled and user.totp_secret:
            # Генерируем QR-код для отображения
            try:
                totp_uri = get_totp_uri(user)
                qr_code = generate_qr_code(totp_uri)
                return render(request, 'admin/setup_totp.html', {
                    'qr_code': qr_code,
                    'totp_uri': totp_uri,
                    'totp_enabled': True,
                    'secret': user.totp_secret,
                })
            except Exception as e:
                messages.error(request, f'Ошибка при генерации QR-кода: {str(e)}')
                return redirect(reverse('admin:index'))
        
        # Генерируем новый секрет
        secret = generate_totp_secret(user)
        totp_uri = get_totp_uri(user, secret)
        qr_code = generate_qr_code(totp_uri)
        
        return render(request, 'admin/setup_totp.html', {
            'qr_code': qr_code,
            'totp_uri': totp_uri,
            'totp_enabled': False,
            'secret': secret,
        })
    
    def post(self, request):
        user = request.user
        verification_code = request.POST.get('verification_code', '').strip()
        
        if not verification_code:
            messages.error(request, 'Пожалуйста, введите код подтверждения.')
            return redirect(reverse('admin:setup_totp'))
        
        # Проверяем код и включаем TOTP
        if enable_totp(user, verification_code):
            messages.success(request, 'Google Authenticator успешно настроен! Теперь вы можете использовать его для входа в админ-панель.')
            return redirect(reverse('admin:index'))
        else:
            messages.error(request, 'Неверный код. Пожалуйста, проверьте код в приложении Google Authenticator и попробуйте снова.')
            # Перезагружаем страницу настройки
            try:
                totp_uri = get_totp_uri(user)
                qr_code = generate_qr_code(totp_uri)
                return render(request, 'admin/setup_totp.html', {
                    'qr_code': qr_code,
                    'totp_uri': totp_uri,
                    'totp_enabled': False,
                    'secret': user.totp_secret,
                    'error': True,
                })
            except Exception:
                return redirect(reverse('admin:setup_totp'))


@method_decorator(staff_member_required, name='dispatch')
class DisableTOTPView(View):
    """Отключение TOTP (Google Authenticator)"""
    
    def post(self, request):
        user = request.user
        confirmation = request.POST.get('confirm', '').strip().lower()
        
        if confirmation != 'отключить':
            messages.error(request, 'Для отключения TOTP введите слово "отключить" в поле подтверждения.')
            return redirect(reverse('admin:setup_totp'))
        
        disable_totp(user)
        messages.success(request, 'Google Authenticator отключен. Теперь вы будете использовать email OTP для входа.')
        return redirect(reverse('admin:index'))

