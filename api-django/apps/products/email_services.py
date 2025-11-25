"""
Email services для уведомлений о подписках
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_subscription_activated_email(user, user_product):
    """
    Отправить email о активации подписки
    """
    product = user_product.product
    subject = f'✅ Подписка "{product.name}" активирована'
    
    # Форматируем дату окончания
    end_date_str = user_product.end_date.strftime('%d.%m.%Y') if user_product.end_date else 'Бессрочно'
    
    # HTML-версия письма
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">🎉 Подписка успешно активирована!</h2>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #10B981;">{product.name}</h3>
                <p><strong>Стоимость:</strong> {product.price} {product.currency}/мес</p>
                <p><strong>Период:</strong> {product.subscription_period}</p>
                <p><strong>Действует до:</strong> {end_date_str}</p>
            </div>
            
            <p>Ваша подписка была успешно активирована. Вы можете приступить к использованию продукта прямо сейчас!</p>
            
            <div style="margin: 30px 0;">
                <a href="{settings.FRONTEND_BASE_URL}/cabinet.html" 
                   style="background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Перейти в личный кабинет
                </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <h3>Автоматическое продление</h3>
            <p>Ваша подписка будет автоматически продлена <strong>{end_date_str}</strong> 
               с привязанной карты <strong>{user_product.payment_method.pan_mask if user_product.payment_method else 'не указана'}</strong>.</p>
            
            <p style="color: #6b7280; font-size: 14px;">
                Вы можете отменить автоматическое продление в любой момент в личном кабинете.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px;">
                С уважением,<br>
                Команда MiniAppExpert
            </p>
        </div>
    </body>
    </html>
    """
    
    # Текстовая версия (fallback)
    text_message = f"""
✅ Подписка успешно активирована!

{product.name}
Стоимость: {product.price} {product.currency}/мес
Период: {product.subscription_period}
Действует до: {end_date_str}

Ваша подписка была успешно активирована. Вы можете приступить к использованию продукта прямо сейчас!

Перейти в личный кабинет: {settings.FRONTEND_BASE_URL}/cabinet.html

Автоматическое продление
Ваша подписка будет автоматически продлена {end_date_str} с привязанной карты {user_product.payment_method.pan_mask if user_product.payment_method else 'не указана'}.

Вы можете отменить автоматическое продление в любой момент в личном кабинете.

С уважением,
Команда MiniAppExpert
    """
    
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Subscription activated email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send subscription activated email to {user.email}: {e}")
        return False


def send_subscription_renewed_email(user, user_product, payment_amount):
    """
    Отправить email о успешном продлении подписки
    """
    product = user_product.product
    subject = f'✅ Подписка "{product.name}" продлена'
    
    end_date_str = user_product.end_date.strftime('%d.%m.%Y') if user_product.end_date else 'Бессрочно'
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">✅ Подписка успешно продлена!</h2>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #10B981;">{product.name}</h3>
                <p><strong>Списано:</strong> {payment_amount} {product.currency}</p>
                <p><strong>Действует до:</strong> {end_date_str}</p>
            </div>
            
            <p>С вашей карты <strong>{user_product.payment_method.pan_mask if user_product.payment_method else 'не указана'}</strong> 
               автоматически списано <strong>{payment_amount} {product.currency}</strong> за продление подписки.</p>
            
            <div style="margin: 30px 0;">
                <a href="{settings.FRONTEND_BASE_URL}/cabinet.html" 
                   style="background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Перейти в личный кабинет
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                Следующее списание произойдет <strong>{end_date_str}</strong>.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px;">
                С уважением,<br>
                Команда MiniAppExpert
            </p>
        </div>
    </body>
    </html>
    """
    
    text_message = f"""
✅ Подписка успешно продлена!

{product.name}
Списано: {payment_amount} {product.currency}
Действует до: {end_date_str}

С вашей карты {user_product.payment_method.pan_mask if user_product.payment_method else 'не указана'} автоматически списано {payment_amount} {product.currency} за продление подписки.

Перейти в личный кабинет: {settings.FRONTEND_BASE_URL}/cabinet.html

Следующее списание произойдет {end_date_str}.

С уважением,
Команда MiniAppExpert
    """
    
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Subscription renewed email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send subscription renewed email to {user.email}: {e}")
        return False


def send_renewal_failed_email(user, user_product, error_message):
    """
    Отправить email о неудачном продлении подписки
    """
    product = user_product.product
    subject = f'⚠️ Не удалось продлить подписку "{product.name}"'
    
    end_date_str = user_product.end_date.strftime('%d.%m.%Y') if user_product.end_date else 'Не указана'
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #EF4444;">⚠️ Не удалось продлить подписку</h2>
            
            <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #EF4444;">{product.name}</h3>
                <p><strong>Стоимость продления:</strong> {user_product.renewal_price} {product.currency}</p>
                <p><strong>Срок действия истекает:</strong> {end_date_str}</p>
                <p><strong>Причина:</strong> {error_message}</p>
            </div>
            
            <p>Мы попытались автоматически продлить вашу подписку, но списание не прошло.</p>
            
            <p><strong>Что делать:</strong></p>
            <ol>
                <li>Проверьте баланс на карте <strong>{user_product.payment_method.pan_mask if user_product.payment_method else 'не указана'}</strong></li>
                <li>Обновите платежные данные в личном кабинете</li>
                <li>Или привяжите другую карту</li>
            </ol>
            
            <div style="margin: 30px 0;">
                <a href="{settings.FRONTEND_BASE_URL}/cabinet.html#payment-methods" 
                   style="background-color: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Обновить платежные данные
                </a>
            </div>
            
            <div style="background-color: #FFF7ED; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⏰ У вас есть 3 дня до приостановки подписки</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">
                    После {end_date_str} доступ к продукту будет ограничен до успешной оплаты.
                </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px;">
                С уважением,<br>
                Команда MiniAppExpert
            </p>
        </div>
    </body>
    </html>
    """
    
    text_message = f"""
⚠️ Не удалось продлить подписку

{product.name}
Стоимость продления: {user_product.renewal_price} {product.currency}
Срок действия истекает: {end_date_str}
Причина: {error_message}

Мы попытались автоматически продлить вашу подписку, но списание не прошло.

Что делать:
1. Проверьте баланс на карте {user_product.payment_method.pan_mask if user_product.payment_method else 'не указана'}
2. Обновите платежные данные в личном кабинете
3. Или привяжите другую карту

Обновить платежные данные: {settings.FRONTEND_BASE_URL}/cabinet.html#payment-methods

⏰ У вас есть 3 дня до приостановки подписки
После {end_date_str} доступ к продукту будет ограничен до успешной оплаты.

С уважением,
Команда MiniAppExpert
    """
    
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Renewal failed email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send renewal failed email to {user.email}: {e}")
        return False


def send_subscription_suspended_email(user, user_product):
    """
    Отправить email о приостановке подписки
    """
    product = user_product.product
    subject = f'⏸️ Подписка "{product.name}" приостановлена'
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #F59E0B;">⏸️ Подписка приостановлена</h2>
            
            <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #F59E0B;">{product.name}</h3>
                <p><strong>Стоимость продления:</strong> {user_product.renewal_price} {product.currency}</p>
                <p><strong>Статус:</strong> Приостановлена</p>
            </div>
            
            <p>Ваша подписка была приостановлена из-за неудачной попытки списания средств.</p>
            
            <p><strong>Доступ к продукту ограничен до восстановления оплаты.</strong></p>
            
            <p>Чтобы восстановить подписку:</p>
            <ol>
                <li>Пополните баланс карты или привяжите новую карту</li>
                <li>Перейдите в личный кабинет</li>
                <li>Нажмите "Возобновить подписку"</li>
            </ol>
            
            <div style="margin: 30px 0;">
                <a href="{settings.FRONTEND_BASE_URL}/cabinet.html" 
                   style="background-color: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Восстановить подписку
                </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px;">
                С уважением,<br>
                Команда MiniAppExpert
            </p>
        </div>
    </body>
    </html>
    """
    
    text_message = f"""
⏸️ Подписка приостановлена

{product.name}
Стоимость продления: {user_product.renewal_price} {product.currency}
Статус: Приостановлена

Ваша подписка была приостановлена из-за неудачной попытки списания средств.

Доступ к продукту ограничен до восстановления оплаты.

Чтобы восстановить подписку:
1. Пополните баланс карты или привяжите новую карту
2. Перейдите в личный кабинет
3. Нажмите "Возобновить подписку"

Восстановить подписку: {settings.FRONTEND_BASE_URL}/cabinet.html

С уважением,
Команда MiniAppExpert
    """
    
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Subscription suspended email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send subscription suspended email to {user.email}: {e}")
        return False


def send_subscription_cancelled_email(user, user_product):
    """
    Отправить email об отмене подписки
    """
    product = user_product.product
    subject = f'❌ Подписка "{product.name}" отменена'
    
    end_date_str = user_product.end_date.strftime('%d.%m.%Y') if user_product.end_date else 'Сразу'
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6B7280;">❌ Подписка отменена</h2>
            
            <div style="background-color: #F9FAFB; border-left: 4px solid #6B7280; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #6B7280;">{product.name}</h3>
                <p><strong>Статус:</strong> Отменена</p>
                <p><strong>Доступ до:</strong> {end_date_str}</p>
            </div>
            
            <p>Ваша подписка была успешно отменена. Автоматическое продление остановлено.</p>
            
            <p>Вы сохраняете доступ к продукту до <strong>{end_date_str}</strong>.</p>
            
            <p>Вы всегда можете возобновить подписку в личном кабинете.</p>
            
            <div style="margin: 30px 0;">
                <a href="{settings.FRONTEND_BASE_URL}/cabinet.html" 
                   style="background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Перейти в личный кабинет
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                Спасибо, что были с нами! Будем рады видеть вас снова.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px;">
                С уважением,<br>
                Команда MiniAppExpert
            </p>
        </div>
    </body>
    </html>
    """
    
    text_message = f"""
❌ Подписка отменена

{product.name}
Статус: Отменена
Доступ до: {end_date_str}

Ваша подписка была успешно отменена. Автоматическое продление остановлено.

Вы сохраняете доступ к продукту до {end_date_str}.

Вы всегда можете возобновить подписку в личном кабинете.

Перейти в личный кабинет: {settings.FRONTEND_BASE_URL}/cabinet.html

Спасибо, что были с нами! Будем рады видеть вас снова.

С уважением,
Команда MiniAppExpert
    """
    
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Subscription cancelled email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send subscription cancelled email to {user.email}: {e}")
        return False




