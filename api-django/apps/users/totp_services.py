"""
Сервисы для работы с TOTP (Google Authenticator)
"""
import pyotp
import qrcode
from io import BytesIO
import base64
from django.conf import settings
from .models import User


def generate_totp_secret(user: User) -> str:
    """Генерация TOTP секрета для пользователя"""
    secret = pyotp.random_base32()
    user.totp_secret = secret
    user.totp_enabled = False  # Пользователь должен сначала подтвердить настройку
    user.save(update_fields=['totp_secret', 'totp_enabled'])
    return secret


def get_totp_uri(user: User, secret: str = None) -> str:
    """Получение URI для настройки TOTP в Google Authenticator"""
    if secret is None:
        secret = user.totp_secret
    
    if not secret:
        raise ValueError("TOTP secret не установлен")
    
    # Формируем URI для Google Authenticator
    issuer_name = getattr(settings, 'TOTP_ISSUER_NAME', 'MiniAppExpert')
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email,
        issuer_name=issuer_name
    )
    return totp_uri


def generate_qr_code(uri: str) -> str:
    """Генерация QR-кода в base64 для отображения в браузере"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Конвертируем в base64
    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"


def verify_totp_code(user: User, code: str, require_enabled: bool = False) -> bool:
    """Проверка TOTP кода от Google Authenticator"""
    if not user.totp_secret:
        return False
    
    # Если требуется, чтобы TOTP был включен (для входа)
    if require_enabled and not user.totp_enabled:
        return False
    
    try:
        totp = pyotp.TOTP(user.totp_secret)
        # Проверяем текущий код и предыдущий/следующий (для небольшой задержки)
        # valid_window=1 означает проверку текущего, предыдущего и следующего кода
        return totp.verify(code, valid_window=1)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error verifying TOTP code: {e}")
        return False


def enable_totp(user: User, verification_code: str) -> bool:
    """Включение TOTP после проверки кода"""
    if not user.totp_secret:
        return False
    
    # Проверяем код (не требуем, чтобы TOTP был включен, так как мы его настраиваем)
    if verify_totp_code(user, verification_code, require_enabled=False):
        user.totp_enabled = True
        user.save(update_fields=['totp_enabled'])
        return True
    return False


def disable_totp(user: User):
    """Отключение TOTP"""
    user.totp_secret = None
    user.totp_enabled = False
    user.save(update_fields=['totp_secret', 'totp_enabled'])

