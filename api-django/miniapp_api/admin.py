"""
Кастомизация Django Admin с OTP
"""
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.urls import path
from apps.users.admin_views_custom import AdminLoginView, AdminResendOTPView


class CustomAdminSite(AdminSite):
    """Кастомный AdminSite с OTP аутентификацией"""
    site_header = "MiniApp Expert Admin"
    site_title = "MiniApp Expert"
    index_title = "Панель управления"
    
    def get_urls(self):
        """Переопределяем URLs для использования кастомного login view"""
        urls = super().get_urls()
        # Заменяем стандартный login view на кастомный с OTP/TOTP
        custom_urls = [
            path('login/', AdminLoginView.as_view(), name='login'),
            path('resend-otp/', AdminResendOTPView.as_view(), name='resend_otp'),
        ]
        
        # Безопасный импорт TOTP views (могут отсутствовать)
        try:
            from apps.users.admin_totp_views import SetupTOTPView, DisableTOTPView
            custom_urls.extend([
                path('setup-totp/', SetupTOTPView.as_view(), name='setup_totp'),
                path('disable-totp/', DisableTOTPView.as_view(), name='disable_totp'),
            ])
        except ImportError:
            # TOTP views не доступны - это нормально, если они еще не загружены
            pass
        
        return custom_urls + urls


# Создаем кастомный admin site
admin_site = CustomAdminSite(name='admin')

# Изменить заголовок админки
admin_site.site_header = "MiniApp Expert Admin"
admin_site.site_title = "MiniApp Expert"
admin_site.index_title = "Панель управления"

# Импортируем все admin.py файлы для регистрации моделей в admin_site
# Важно: импорты должны быть после создания admin_site
# Django автоматически импортирует admin.py файлы при запуске, но для кастомного admin_site
# нужно явно импортировать их здесь, чтобы декораторы @admin_site.register() сработали
# Но мы не можем импортировать их здесь из-за циклических зависимостей при autodiscover
# Поэтому регистрируем модели напрямую после импорта классов
def _register_all_models():
    """Регистрируем все модели в кастомном admin_site"""
    # Импортируем модели и админ-классы после создания admin_site
    try:
        # Пользователи
        from apps.users.models import User
        from apps.users.admin_otp import AdminOTP
        from apps.users.admin import UserAdmin, AdminOTPAdmin
        admin_site.register(User, UserAdmin)
        admin_site.register(AdminOTP, AdminOTPAdmin)
        
        # Продукты
        from apps.products.models import Product, UserProduct
        from apps.products.admin import ProductAdmin, UserProductAdmin
        admin_site.register(Product, ProductAdmin)
        admin_site.register(UserProduct, UserProductAdmin)
        
        # Заказы
        from apps.orders.models import Order
        from apps.orders.admin import OrderAdmin
        admin_site.register(Order, OrderAdmin)
        
        # Платежи
        from apps.payments.models import PaymentMethod, Mandate, Payment, ManualCharge, Transaction
        from apps.payments.admin import PaymentMethodAdmin, MandateAdmin, PaymentAdmin, ManualChargeAdmin, TransactionAdmin
        admin_site.register(PaymentMethod, PaymentMethodAdmin)
        admin_site.register(Mandate, MandateAdmin)
        admin_site.register(Payment, PaymentAdmin)
        admin_site.register(ManualCharge, ManualChargeAdmin)
        admin_site.register(Transaction, TransactionAdmin)
        
        # Аффилиаты
        from apps.affiliates.models import Referral, ReferralPayout, ReferralCommission
        from apps.affiliates.admin import ReferralAdmin, ReferralPayoutAdmin, ReferralCommissionAdmin
        admin_site.register(Referral, ReferralAdmin)
        admin_site.register(ReferralPayout, ReferralPayoutAdmin)
        admin_site.register(ReferralCommission, ReferralCommissionAdmin)
        
        # Аудит
        from apps.audit.models import AuditLog, TrackingEvent
        from apps.audit.admin import AuditLogAdmin, TrackingEventAdmin
        admin_site.register(AuditLog, AuditLogAdmin)
        admin_site.register(TrackingEvent, TrackingEventAdmin)
        
        # Документы
        from apps.documents.models import Document, DocumentAcceptance
        from apps.documents.admin import DocumentAdmin, DocumentAcceptanceAdmin
        admin_site.register(Document, DocumentAdmin)
        admin_site.register(DocumentAcceptance, DocumentAcceptanceAdmin)
        
    except ImportError as e:
        # Игнорируем ошибки импорта - они могут возникнуть при первой загрузке
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Could not import some admin modules: {e}")

# Вызываем функцию регистрации
_register_all_models()
