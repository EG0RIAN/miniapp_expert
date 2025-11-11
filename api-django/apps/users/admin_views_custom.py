"""
Кастомные views для админки с OTP
"""
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import authenticate, login
from django.contrib.auth.views import LoginView
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.decorators import method_decorator
from django.contrib import messages
from django.conf import settings
from django.utils import timezone
from django.views import View
from django.http import JsonResponse
from .models import User
from .admin_otp import AdminOTP
from .admin_services import generate_and_send_admin_otp
# Безопасный импорт TOTP сервисов (могут отсутствовать до загрузки файлов)
try:
    from .totp_services import verify_totp_code
except ImportError:
    verify_totp_code = None
import logging

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Получение IP адреса клиента"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(never_cache, name='dispatch')
@method_decorator(sensitive_post_parameters(), name='dispatch')
class AdminLoginView(LoginView):
    """Кастомный view для входа в админку с OTP"""
    template_name = 'admin/admin_login_otp.html'
    redirect_authenticated_user = True
    
    def get(self, request, *args, **kwargs):
        # Если пользователь уже авторизован, перенаправляем в админку
        if request.user.is_authenticated and request.user.is_staff:
            return redirect(reverse('admin:index'))
        return super().get(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        step = request.POST.get('step', 'login')
        
        if step == 'login':
            # Шаг 1: Проверка логина и пароля
            username = request.POST.get('username')
            password = request.POST.get('password')
            
            if not username or not password:
                messages.error(request, 'Пожалуйста, введите email и пароль.')
                return render(request, self.template_name, {'step': 'login'})
            
            # Аутентификация пользователя
            user = authenticate(request, username=username, password=password)
            
            if user is None:
                messages.error(request, 'Неверный email или пароль.')
                return render(request, self.template_name, {'step': 'login'})
            
            # Проверяем, что пользователь является staff
            if not user.is_staff:
                messages.error(request, 'У вас нет доступа к админ-панели.')
                return render(request, self.template_name, {'step': 'login'})
            
            # ВРЕМЕННО ОТКЛЮЧЕНО: OTP пропускается, сразу авторизуем пользователя
            # TODO: Включить OTP обратно после настройки email/TOTP
            # 
            # Для восстановления OTP - раскомментировать код ниже и удалить эти 3 строки:
            login(request, user)
            messages.success(request, f'Добро пожаловать, {user.email}!')
            return redirect(reverse('admin:index'))
            
            # ========== КОД OTP (закомментирован, для восстановления) ==========
            # 
            # # Проверяем, включен ли TOTP (Google Authenticator)
            # totp_secret = getattr(user, 'totp_secret', None)
            # totp_enabled = getattr(user, 'totp_enabled', False)
            # if totp_secret and totp_enabled:
            #     # Используем Google Authenticator
            #     request.session['admin_otp_user_id'] = user.id
            #     request.session['admin_otp_method'] = 'totp'
            #     messages.info(request, 'Введите код из приложения Google Authenticator')
            #     return render(request, self.template_name, {
            #         'step': 'totp',
            #         'user_email': user.email,
            #         'totp_method': True,
            #     })
            # else:
            #     # Используем email OTP
            #     ip_address = get_client_ip(request)
            #     try:
            #         otp = generate_and_send_admin_otp(user, ip_address=ip_address)
            #         if otp is None:
            #             logger.warning(f"Failed to send OTP email for user {user.email}. TOTP not configured.")
            #             messages.error(request, 
            #                 'Ошибка отправки кода на email. Пожалуйста, настройте Google Authenticator для входа. '
            #                 'Обратитесь к администратору для настройки TOTP.')
            #             return render(request, self.template_name, {'step': 'login'})
            #         request.session['admin_otp_user_id'] = user.id
            #         request.session['admin_otp_sent_at'] = timezone.now().isoformat()
            #         request.session['admin_otp_method'] = 'email'
            #         messages.success(request, f'Код отправлен на email {user.email}. Проверьте почту.')
            #         return render(request, self.template_name, {
            #             'step': 'otp',
            #             'user_email': user.email,
            #             'totp_method': False,
            #         })
            #     except Exception as e:
            #         logger.error(f"Error sending OTP email: {e}", exc_info=True)
            #         messages.error(request, 
            #             f'Ошибка отправки кода на email: {str(e)}. '
            #             'Пожалуйста, настройте Google Authenticator для входа или обратитесь к администратору.')
            #         return render(request, self.template_name, {'step': 'login'})
            # ========== КОНЕЦ КОДА OTP ==========
        
        elif step == 'otp' or step == 'totp':
            # Шаг 2: Проверка OTP кода (email или TOTP)
            user_id = request.session.get('admin_otp_user_id')
            otp_method = request.session.get('admin_otp_method', 'email')
            otp_code = request.POST.get('otp_code', '').strip()
            
            if not user_id:
                messages.error(request, 'Сессия истекла. Пожалуйста, войдите заново.')
                return redirect(reverse('admin:login'))
            
            if not otp_code:
                messages.error(request, 'Пожалуйста, введите код.')
                try:
                    user = User.objects.get(id=user_id)
                    return render(request, self.template_name, {
                        'step': 'totp' if otp_method == 'totp' else 'otp',
                        'user_email': user.email,
                        'totp_method': otp_method == 'totp',
                    })
                except User.DoesNotExist:
                    return redirect(reverse('admin:login'))
            
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                messages.error(request, 'Пользователь не найден.')
                if 'admin_otp_user_id' in request.session:
                    del request.session['admin_otp_user_id']
                return redirect(reverse('admin:login'))
            
            # Проверяем код в зависимости от метода
            code_valid = False
            if otp_method == 'totp':
                # Проверяем TOTP код от Google Authenticator (требуем, чтобы TOTP был включен)
                if verify_totp_code is not None:
                    code_valid = verify_totp_code(user, otp_code, require_enabled=True)
                else:
                    # TOTP не доступен, код неверен
                    logger.error("TOTP services not available")
                    code_valid = False
            else:
                # Проверяем email OTP
                code_valid = AdminOTP.verify_otp(user, otp_code)
            
            if code_valid:
                # Код верный, авторизуем пользователя
                login(request, user)
                
                # Очищаем сессию
                if 'admin_otp_user_id' in request.session:
                    del request.session['admin_otp_user_id']
                if 'admin_otp_sent_at' in request.session:
                    del request.session['admin_otp_sent_at']
                if 'admin_otp_method' in request.session:
                    del request.session['admin_otp_method']
                
                messages.success(request, f'Добро пожаловать, {user.email}!')
                return redirect(reverse('admin:index'))
            else:
                messages.error(request, 'Неверный код. Пожалуйста, проверьте и попробуйте снова.')
                return render(request, self.template_name, {
                    'step': 'totp' if otp_method == 'totp' else 'otp',
                    'user_email': user.email,
                    'totp_method': otp_method == 'totp',
                })
        
        # Если step неизвестен, возвращаемся к шагу login
        return render(request, self.template_name, {'step': 'login'})


@method_decorator(never_cache, name='dispatch')
class AdminResendOTPView(LoginView):
    """View для повторной отправки OTP"""
    template_name = 'admin/admin_login_otp.html'
    
    def post(self, request, *args, **kwargs):
        user_id = request.session.get('admin_otp_user_id')
        
        if not user_id:
            messages.error(request, 'Сессия истекла. Пожалуйста, войдите заново.')
            return redirect(reverse('admin:login'))
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            messages.error(request, 'Пользователь не найден.')
            if 'admin_otp_user_id' in request.session:
                del request.session['admin_otp_user_id']
            return redirect(reverse('admin:login'))
        
        # Проверяем, что прошло не менее 1 минуты с последней отправки
        sent_at_str = request.session.get('admin_otp_sent_at')
        if sent_at_str:
            from datetime import datetime
            sent_at = datetime.fromisoformat(sent_at_str)
            if (timezone.now() - sent_at.replace(tzinfo=timezone.get_current_timezone())).total_seconds() < 60:
                messages.warning(request, 'Пожалуйста, подождите минуту перед повторной отправкой кода.')
                return render(request, self.template_name, {
                    'step': 'otp',
                    'user_email': user.email,
                })
        
        # Генерируем и отправляем новый OTP
        ip_address = get_client_ip(request)
        otp = generate_and_send_admin_otp(user, ip_address=ip_address)
        
        if otp is None:
            messages.error(request, 'Ошибка отправки кода. Попробуйте позже или обратитесь в поддержку.')
        else:
            request.session['admin_otp_sent_at'] = timezone.now().isoformat()
            messages.success(request, f'Новый код отправлен на email {user.email}.')
        
        return render(request, self.template_name, {
            'step': 'otp',
            'user_email': user.email,
        })

