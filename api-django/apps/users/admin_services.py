"""
Сервисы для работы с OTP в админке
"""
from django.conf import settings
from django.core.mail import send_mail, get_connection
from django.core.mail.message import EmailMultiAlternatives
from django.utils import timezone
import socket
from .admin_otp import AdminOTP
from .models import User


def send_admin_otp_email(user: User, otp_code: str, ip_address: str = None):
    """Отправка OTP кода на email для входа в админку"""
    subject = 'Код для входа в админ-панель MiniAppExpert'
    
    message = f"""
Здравствуйте, {user.name or user.email}!

Вы запросили код для входа в админ-панель MiniAppExpert.

Ваш код: {otp_code}

Код действителен в течение 10 минут.

Если вы не запрашивали этот код, пожалуйста, проигнорируйте это письмо и сообщите в службу поддержки.

Время запроса: {timezone.now().strftime('%d.%m.%Y %H:%M:%S')}
{f'IP адрес: {ip_address}' if ip_address else ''}

С уважением,
Команда MiniAppExpert
"""
    
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10B981 0%, #0088CC 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .otp-code {{ font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: white; border: 3px solid #10B981; border-radius: 10px; margin: 20px 0; letter-spacing: 5px; color: #10B981; }}
        .warning {{ background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Код для входа в админ-панель</h1>
        </div>
        <div class="content">
            <p>Здравствуйте, <strong>{user.name or user.email}</strong>!</p>
            <p>Вы запросили код для входа в админ-панель MiniAppExpert.</p>
            <p>Ваш код:</p>
            <div class="otp-code">{otp_code}</div>
            <p style="text-align: center; color: #666;">Код действителен в течение <strong>10 минут</strong></p>
            <div class="warning">
                <strong>⚠️ Важно:</strong> Если вы не запрашивали этот код, пожалуйста, проигнорируйте это письмо и сообщите в службу поддержки.
            </div>
            <p style="font-size: 12px; color: #666;">
                Время запроса: {timezone.now().strftime('%d.%m.%Y %H:%M:%S')}<br>
                {f'IP адрес: {ip_address}' if ip_address else ''}
            </p>
        </div>
        <div class="footer">
            <p>С уважением,<br>Команда MiniAppExpert</p>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        # Force IPv4 for SMTP connection
        smtp_host = settings.EMAIL_HOST
        try:
            ipv4 = socket.gethostbyname(smtp_host)
            connection = get_connection(
                backend=settings.EMAIL_BACKEND,
                host=ipv4,
                port=settings.EMAIL_PORT,
                username=settings.EMAIL_HOST_USER,
                password=settings.EMAIL_HOST_PASSWORD,
                use_tls=settings.EMAIL_USE_TLS,
                use_ssl=getattr(settings, 'EMAIL_USE_SSL', False),
                fail_silently=False,
            )
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                connection=connection,
            )
            email.attach_alternative(html_message, "text/html")
            email.send()
            return True
        except socket.gaierror:
            # Fallback to regular send_mail if IPv4 resolution fails
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
    except Exception as e:
        print(f"Error sending admin OTP email: {e}")
        import traceback
        traceback.print_exc()
        return False


def generate_and_send_admin_otp(user: User, ip_address: str = None):
    """Генерация и отправка OTP кода для входа в админку"""
    # Создаем OTP
    otp = AdminOTP.create_otp(user, ip_address=ip_address, expires_in_minutes=10)
    
    # Отправляем на email
    success = send_admin_otp_email(user, otp.code, ip_address)
    
    if success:
        return otp
    else:
        # Если не удалось отправить email, удаляем OTP
        otp.delete()
        return None

