"""
Django settings for miniapp_api project.
"""
import os
from pathlib import Path
from decouple import config
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin.apps.SimpleAdminConfig',  # Используем SimpleAdminConfig чтобы отключить autodiscover
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'apps.users',
    'apps.products',
    'apps.orders',
    'apps.payments',
    'apps.affiliates',
    'apps.audit',
    'apps.documents',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'apps.users.middleware.DisableCSRFForAPI',  # Disable CSRF for API endpoints - must be before CsrfViewMiddleware
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.audit.middleware.AuditLogMiddleware',
]

# CSRF settings - exempt API endpoints
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='https://miniapp.expert,http://localhost:3000'
).split(',')

ROOT_URLCONF = 'miniapp_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],  # Добавляем папку templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'miniapp_api.wsgi.application'

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=config(
            'DATABASE_URL',
            default=f"postgresql://{config('DB_USER', default='miniuser')}:{config('DB_PASSWORD', default='minipass')}@{config('DB_HOST', default='localhost')}:{config('DB_PORT', default='5432')}/{config('DB_DATABASE', default='miniapp')}"
        )
    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# TOTP settings
TOTP_ISSUER_NAME = 'MiniAppExpert'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        # SessionAuthentication removed to avoid CSRF issues for API endpoints
        # 'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# CORS
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='https://miniapp.expert,http://localhost:3000'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# T-Bank API
TBANK_TERMINAL_KEY = config('TBANK_TERMINAL_KEY', default='')
TBANK_PASSWORD = config('TBANK_PASSWORD', default='')
TBANK_API_URL = config('TBANK_API_URL', default='https://securepay.tinkoff.ru/v2')

# Email settings (Mail.ru SMTP)
# Mail.ru поддерживает два варианта:
# - Порт 465 с SSL (EMAIL_USE_SSL=True, EMAIL_USE_TLS=False) - может быть заблокирован
# - Порт 587 с STARTTLS (EMAIL_USE_TLS=True, EMAIL_USE_SSL=False) - рекомендуется
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('SMTP_HOST', default='smtp.mail.ru')
EMAIL_PORT = config('SMTP_PORT', default=587, cast=int)  # Порт 587 для STARTTLS (более надежный)
EMAIL_USE_TLS = config('SMTP_USE_TLS', default=True, cast=bool)  # True для STARTTLS на порту 587
EMAIL_USE_SSL = config('SMTP_USE_SSL', default=False, cast=bool)  # False для STARTTLS на порту 587
EMAIL_HOST_USER = config('SMTP_USER', default='no-reply@miniapp.expert')
EMAIL_HOST_PASSWORD = config('SMTP_PASS', default='WjjmVlTb3OmQ3MxEfavh')
DEFAULT_FROM_EMAIL = config('MAIL_FROM', default='MiniAppExpert <no-reply@miniapp.expert>')
EMAIL_TIMEOUT = 10  # Таймаут подключения к SMTP (секунды)

# Тестовый режим: перенаправление всех писем на тестовый email
EMAIL_TEST_MODE = config('EMAIL_TEST_MODE', default=True, cast=bool)
EMAIL_TEST_RECIPIENT = config('EMAIL_TEST_RECIPIENT', default='e.arkhiptsev@gmail.com')

# Альтернативные способы отправки email (через API)
# SendGrid (бесплатно до 100 писем/день)
SENDGRID_API_KEY = config('SENDGRID_API_KEY', default='')

# Mailgun (бесплатно до 5000 писем/месяц)
MAILGUN_API_KEY = config('MAILGUN_API_KEY', default='')
MAILGUN_DOMAIN = config('MAILGUN_DOMAIN', default='')

# Альтернативный SMTP (например, Yandex)
EMAIL_ALT_HOST = config('EMAIL_ALT_HOST', default='')
EMAIL_ALT_PORT = config('EMAIL_ALT_PORT', default=465, cast=int)
EMAIL_ALT_USER = config('EMAIL_ALT_USER', default='')
EMAIL_ALT_PASS = config('EMAIL_ALT_PASS', default='')
EMAIL_ALT_USE_TLS = config('EMAIL_ALT_USE_TLS', default=False, cast=bool)
EMAIL_ALT_USE_SSL = config('EMAIL_ALT_USE_SSL', default=True, cast=bool)

# App settings
APP_BASE_URL = config('APP_BASE_URL', default='https://miniapp.expert')
FRONTEND_BASE_URL = config('FRONTEND_BASE_URL', default='https://miniapp.expert')
API_BASE_URL = config('API_BASE_URL', default='https://miniapp.expert')

# Magic link secret
MAGIC_SECRET = config('MAGIC_SECRET', default='change-me-in-production')

