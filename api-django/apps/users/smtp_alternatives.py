"""
Альтернативные способы отправки email через API сервисы
"""
from django.conf import settings
import requests
import json


def send_email_via_sendgrid(subject, html_content, plain_text, recipient_email, from_email=None):
    """
    Отправка email через SendGrid API
    Требуется установка: pip install sendgrid
    И настройка SENDGRID_API_KEY в settings.py
    """
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        if not hasattr(settings, 'SENDGRID_API_KEY'):
            print("SENDGRID_API_KEY not configured")
            return False
        
        if from_email is None:
            from_email = settings.DEFAULT_FROM_EMAIL
        
        message = Mail(
            from_email=from_email,
            to_emails=recipient_email,
            subject=subject,
            html_content=html_content,
            plain_text_content=plain_text
        )
        
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code == 202:
            print(f"Email sent via SendGrid to {recipient_email}")
            return True
        else:
            print(f"SendGrid error: {response.status_code} - {response.body}")
            return False
    except ImportError:
        print("SendGrid library not installed. Install with: pip install sendgrid")
        return False
    except Exception as e:
        print(f"SendGrid error: {e}")
        return False


def send_email_via_mailgun(subject, html_content, plain_text, recipient_email, from_email=None):
    """
    Отправка email через Mailgun API
    Требуется настройка MAILGUN_API_KEY и MAILGUN_DOMAIN в settings.py
    """
    try:
        if not hasattr(settings, 'MAILGUN_API_KEY') or not hasattr(settings, 'MAILGUN_DOMAIN'):
            print("MAILGUN_API_KEY and MAILGUN_DOMAIN not configured")
            return False
        
        if from_email is None:
            from_email = settings.DEFAULT_FROM_EMAIL
        
        api_url = f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages"
        
        response = requests.post(
            api_url,
            auth=("api", settings.MAILGUN_API_KEY),
            data={
                "from": from_email,
                "to": recipient_email,
                "subject": subject,
                "text": plain_text,
                "html": html_content
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"Email sent via Mailgun to {recipient_email}")
            return True
        else:
            print(f"Mailgun error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Mailgun error: {e}")
        return False


def send_email_via_http_api(subject, html_content, plain_text, recipient_email, from_email=None):
    """
    Универсальная функция для отправки через HTTP API
    Пытается использовать доступные методы по очереди
    """
    # Пробуем SendGrid
    if hasattr(settings, 'SENDGRID_API_KEY') and settings.SENDGRID_API_KEY:
        if send_email_via_sendgrid(subject, html_content, plain_text, recipient_email, from_email):
            return True
    
    # Пробуем Mailgun
    if hasattr(settings, 'MAILGUN_API_KEY') and hasattr(settings, 'MAILGUN_DOMAIN'):
        if send_email_via_mailgun(subject, html_content, plain_text, recipient_email, from_email):
            return True
    
    return False

