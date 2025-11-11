from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
import uuid
import hashlib
from datetime import datetime, timedelta


def get_email_recipient(original_email):
    """Получить email получателя (тестовый режим или оригинальный)"""
    if getattr(settings, 'EMAIL_TEST_MODE', False):
        test_recipient = getattr(settings, 'EMAIL_TEST_RECIPIENT', 'e.arkhiptsev@gmail.com')
        print(f"TEST MODE: Redirecting email from {original_email} to {test_recipient}")
        return test_recipient
    return original_email


def get_email_template(title, greeting, content_html, button_text=None, button_url=None, footer_text=None, warning_html=None):
    """Генерация красивого HTML шаблона для email"""
    button_html = ""
    if button_text and button_url:
        button_html = f'''
            <div style="text-align: center; margin: 30px 0;">
                <a href="{button_url}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #10B981 0%, #0088CC 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    {button_text}
                </a>
            </div>
        '''
    
    warning_section = ""
    if warning_html:
        warning_section = f'''
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                {warning_html}
            </div>
        '''
    
    footer_html = footer_text or "С уважением,<br>Команда MiniAppExpert"
    
    html = f"""
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        .email-header {{
            background: linear-gradient(135deg, #10B981 0%, #0088CC 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }}
        .email-header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }}
        .email-content {{
            padding: 40px 30px;
            background-color: #ffffff;
        }}
        .email-content p {{
            margin: 15px 0;
            font-size: 16px;
            line-height: 1.8;
        }}
        .email-content strong {{
            color: #0088CC;
        }}
        .button-wrapper {{
            text-align: center;
            margin: 30px 0;
        }}
        .email-button {{
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #10B981 0%, #0088CC 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }}
        .email-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }}
        .warning-box {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .warning-box ul {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        .warning-box li {{
            margin: 5px 0;
        }}
        .email-footer {{
            background-color: #f9f9f9;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e0e0e0;
        }}
        .link-text {{
            word-break: break-all;
            color: #0088CC;
            font-size: 14px;
            margin-top: 15px;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>{title}</h1>
        </div>
        <div class="email-content">
            {greeting}
            {content_html}
            {button_html}
            {warning_section}
        </div>
        <div class="email-footer">
            <p>{footer_html}</p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Это автоматическое письмо, пожалуйста, не отвечайте на него.
            </p>
        </div>
    </div>
</body>
</html>
    """
    return html.strip()


def send_email_with_template(subject, html_content, plain_text, recipient_email, from_email=None):
    """Универсальная функция для отправки email с HTML шаблоном"""
    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL
    
    # Используем тестовый email в тестовом режиме
    original_email = recipient_email
    recipient_email = get_email_recipient(recipient_email)
    
    # Попытка 1: Использовать альтернативные API (SendGrid, Mailgun)
    try:
        from .smtp_alternatives import send_email_via_http_api
        if send_email_via_http_api(subject, html_content, plain_text, recipient_email, from_email):
            print(f"Email sent via API to {recipient_email} (original: {original_email})")
            return True
    except ImportError:
        # Модуль smtp_alternatives не настроен, продолжаем
        pass
    except Exception as e:
        print(f"API email sending failed: {e}")
    
    # Попытка 2: Стандартный SMTP через Django
    try:
        # Используем стандартный send_mail с настройками из settings.py
        send_mail(
            subject=subject,
            message=plain_text,
            from_email=from_email,
            recipient_list=[recipient_email],
            html_message=html_content,
            fail_silently=False,
        )
        print(f"Email sent successfully via SMTP to {recipient_email} (original: {original_email})")
        return True
    except Exception as e:
        print(f"Error sending email via SMTP to {recipient_email}: {e}")
        import traceback
        traceback.print_exc()
        
        # Попытка 3: Использовать альтернативный SMTP (Yandex) если настроен
        try:
            if hasattr(settings, 'EMAIL_ALT_HOST') and settings.EMAIL_ALT_HOST:
                from django.core.mail import get_connection
                from django.core.mail.message import EmailMultiAlternatives
                
                alt_connection = get_connection(
                    backend=settings.EMAIL_BACKEND,
                    host=settings.EMAIL_ALT_HOST,
                    port=getattr(settings, 'EMAIL_ALT_PORT', 465),
                    username=getattr(settings, 'EMAIL_ALT_USER', settings.EMAIL_HOST_USER),
                    password=getattr(settings, 'EMAIL_ALT_PASS', settings.EMAIL_HOST_PASSWORD),
                    use_tls=getattr(settings, 'EMAIL_ALT_USE_TLS', False),
                    use_ssl=getattr(settings, 'EMAIL_ALT_USE_SSL', True),
                    fail_silently=False,
                )
                
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=plain_text,
                    from_email=from_email,
                    to=[recipient_email],
                    connection=alt_connection,
                )
                email.attach_alternative(html_content, "text/html")
                email.send()
                print(f"Email sent via alternative SMTP to {recipient_email}")
                return True
        except Exception as alt_e:
            print(f"Alternative SMTP also failed: {alt_e}")
        
        return False


def generate_verification_token(email: str) -> str:
    """Генерация токена для подтверждения email"""
    secret = settings.MAGIC_SECRET
    timestamp = datetime.now().strftime('%Y-%m-%d')
    token_string = f"{email}:{timestamp}:{secret}"
    token = hashlib.sha256(token_string.encode()).hexdigest()
    return token


def verify_token(email: str, token: str) -> bool:
    """Проверка токена для подтверждения email"""
    secret = settings.MAGIC_SECRET
    # Проверяем токен за последние 7 дней
    for days_ago in range(7):
        timestamp = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        token_string = f"{email}:{timestamp}:{secret}"
        expected_token = hashlib.sha256(token_string.encode()).hexdigest()
        if token == expected_token:
            return True
    return False


def send_verification_email(user, token: str = None):
    """Отправка email с ссылкой для подтверждения"""
    # Генерируем токен, если не передан
    if not token:
        token = generate_verification_token(user.email)
    
    # Сохраняем токен в базе данных для последующей проверки
    user.verification_token = token
    user.save(update_fields=['verification_token'])
    
    verification_url = f"{settings.FRONTEND_BASE_URL}/verify-email.html?token={token}&email={user.email}"
    
    subject = 'Подтвердите ваш email - MiniAppExpert'
    
    greeting = f'<p>Здравствуйте, <strong>{user.name or user.email}</strong>!</p>'
    content = f'''
        <p>Спасибо за регистрацию в MiniAppExpert.</p>
        <p>Для подтверждения вашего email адреса, пожалуйста, нажмите на кнопку ниже:</p>
        <p class="link-text">Или скопируйте и вставьте эту ссылку в браузер:<br>{verification_url}</p>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
    '''
    
    html_content = get_email_template(
        title="Подтвердите ваш email",
        greeting=greeting,
        content_html=content,
        button_text="Подтвердить email",
        button_url=verification_url,
    )
    
    plain_text = f"""
Здравствуйте, {user.name or user.email}!

Спасибо за регистрацию в MiniAppExpert.

Для подтверждения вашего email адреса, пожалуйста, перейдите по ссылке:
{verification_url}

Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.

С уважением,
Команда MiniAppExpert
"""
    
    return send_email_with_template(subject, html_content, plain_text, user.email)


def send_welcome_email(user, order=None):
    """Отправка welcome email после успешной оплаты"""
    subject = 'Добро пожаловать в MiniAppExpert!'
    
    product_name = "ваш продукт"
    if order and order.product:
        product_name = order.product.name
    
    greeting = f'<p>Здравствуйте, <strong>{user.name or user.email}</strong>!</p>'
    content = f'''
        <p>Спасибо за ваш заказ!</p>
        <p>Ваш продукт <strong>{product_name}</strong> готов к использованию.</p>
        <p><strong>Данные для входа:</strong></p>
        <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;">📧 Email: <strong>{user.email}</strong></li>
            <li style="margin: 10px 0;">🔑 Пароль: используйте пароль, который вы указали при регистрации</li>
        </ul>
        <p>Если у вас возникнут вопросы, мы всегда готовы помочь!</p>
    '''
    
    html_content = get_email_template(
        title="Добро пожаловать!",
        greeting=greeting,
        content_html=content,
        button_text="Открыть личный кабинет",
        button_url=f"{settings.FRONTEND_BASE_URL}/cabinet.html",
    )
    
    plain_text = f"""
Здравствуйте, {user.name or user.email}!

Спасибо за ваш заказ!

Ваш продукт {product_name} готов к использованию.

Данные для входа:
- Email: {user.email}
- Пароль: используйте пароль, который вы указали при регистрации

Ссылка на личный кабинет: {settings.FRONTEND_BASE_URL}/cabinet.html

Если у вас возникнут вопросы, мы всегда готовы помочь!

С уважением,
Команда MiniAppExpert
"""
    
    return send_email_with_template(subject, html_content, plain_text, user.email)


def generate_reset_token() -> str:
    """Генерация токена для сброса пароля"""
    return str(uuid.uuid4())


def send_password_reset_email(user, reset_token: str):
    """Отправка email со ссылкой для сброса пароля"""
    reset_url = f"{settings.FRONTEND_BASE_URL}/reset-password.html?token={reset_token}&email={user.email}"
    
    subject = 'Восстановление пароля - MiniAppExpert'
    
    greeting = f'<p>Здравствуйте, <strong>{user.name or user.email}</strong>!</p>'
    content = f'''
        <p>Вы запросили восстановление пароля для вашего аккаунта в MiniAppExpert.</p>
        <p>Для установки нового пароля, пожалуйста, нажмите на кнопку ниже:</p>
        <p class="link-text">Или скопируйте и вставьте эту ссылку в браузер:<br>{reset_url}</p>
    '''
    
    warning_html = '''
        <p><strong>⚠️ Важно:</strong></p>
        <ul>
            <li>Эта ссылка действительна в течение 24 часов</li>
            <li>После использования ссылка станет недействительной</li>
            <li>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо</li>
        </ul>
    '''
    
    html_content = get_email_template(
        title="Восстановление пароля",
        greeting=greeting,
        content_html=content,
        button_text="Восстановить пароль",
        button_url=reset_url,
        warning_html=warning_html,
    )
    
    plain_text = f"""
Здравствуйте, {user.name or user.email}!

Вы запросили восстановление пароля для вашего аккаунта в MiniAppExpert.

Для установки нового пароля, пожалуйста, перейдите по ссылке:
{reset_url}

Эта ссылка действительна в течение 24 часов.

Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
Ваш пароль останется без изменений.

С уважением,
Команда MiniAppExpert
"""
    
    return send_email_with_template(subject, html_content, plain_text, user.email)


def send_subscription_reminder_email(user, user_product, days_before=3):
    """Отправка напоминания о предстоящем списании подписки"""
    if not user_product or user_product.product.product_type != 'subscription':
        return False
    
    product = user_product.product
    renewal_date = user_product.end_date
    amount = user_product.renewal_price or product.price
    
    subject = f'Напоминание о продлении подписки {product.name} - MiniAppExpert'
    
    greeting = f'<p>Здравствуйте, <strong>{user.name or user.email}</strong>!</p>'
    content = f'''
        <p>Напоминаем, что через <strong>{days_before} дня</strong> будет автоматически продлена ваша подписка <strong>{product.name}</strong>.</p>
        <div style="background: #f0f9ff; border: 2px solid #0088CC; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📦 Продукт:</strong> {product.name}</p>
            <p style="margin: 5px 0;"><strong>💰 Сумма списания:</strong> {amount:.2f} {product.currency}</p>
            <p style="margin: 5px 0;"><strong>📅 Дата списания:</strong> {renewal_date.strftime("%d.%m.%Y") if renewal_date else "Не указана"}</p>
        </div>
        <p>Списание будет произведено автоматически с привязанной карты.</p>
        <p>Если вы хотите отменить подписку или изменить способ оплаты, перейдите в личный кабинет.</p>
    '''
    
    html_content = get_email_template(
        title="Напоминание о продлении подписки",
        greeting=greeting,
        content_html=content,
        button_text="Управлять подпиской",
        button_url=f"{settings.FRONTEND_BASE_URL}/cabinet.html#subscriptions",
    )
    
    plain_text = f"""
Здравствуйте, {user.name or user.email}!

Напоминаем, что через {days_before} дня будет автоматически продлена ваша подписка {product.name}.

Продукт: {product.name}
Сумма списания: {amount:.2f} {product.currency}
Дата списания: {renewal_date.strftime("%d.%m.%Y") if renewal_date else "Не указана"}

Списание будет произведено автоматически с привязанной карты.

Если вы хотите отменить подписку или изменить способ оплаты, перейдите в личный кабинет:
{settings.FRONTEND_BASE_URL}/cabinet.html#subscriptions

С уважением,
Команда MiniAppExpert
"""
    
    return send_email_with_template(subject, html_content, plain_text, user.email)
