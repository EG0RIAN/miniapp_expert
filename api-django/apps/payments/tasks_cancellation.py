"""
Celery tasks для обработки запросов на отмену подписки
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_expired_cancellation_requests(self):
    """
    Обрабатывает истекшие запросы на отмену.
    Если реферал не принял решение в течение 24 часов - отменяет подписку автоматически.
    
    Запускается каждый час через Celery Beat.
    """
    from .models_cancellation import CancellationRequest
    from apps.users.tasks import send_email_task
    
    try:
        # Найти все истекшие запросы со статусом pending
        expired_requests = CancellationRequest.objects.filter(
            status='pending',
            expires_at__lte=timezone.now()
        ).select_related('user_product', 'requested_by', 'referrer')
        
        count = expired_requests.count()
        logger.info(f"Found {count} expired cancellation requests")
        
        for request in expired_requests:
            logger.info(
                f"Автоотмена запроса #{request.id} от {request.requested_by.email} "
                f"(реферал {request.referrer.email if request.referrer else 'None'} не ответил)"
            )
            
            # Отменить подписку
            request.expire()
            
            # Уведомить пользователя
            send_email_task.delay(
                subject='Ваша подписка отменена',
                message=f'''
                Здравствуйте, {request.requested_by.get_full_name()}!
                
                Ваша подписка "{request.user_product.product.name}" была отменена.
                
                Причина: Ваш реферал не принял решение в течение 24 часов после вашего запроса на отмену.
                
                Если у вас есть вопросы, обратитесь в службу поддержки.
                
                Ваш личный кабинет: https://miniapp.expert/cabinet.html
                ''',
                recipient_list=[request.requested_by.email],
            )
            
            # Уведомить реферала
            if request.referrer:
                send_email_task.delay(
                    subject='Подписка реферала отменена автоматически',
                    message=f'''
                    Здравствуйте, {request.referrer.get_full_name()}!
                    
                    Подписка вашего реферала {request.requested_by.email} на "{request.user_product.product.name}" была автоматически отменена, так как вы не приняли решение в течение 24 часов.
                    
                    Запрос был создан: {request.created_at.strftime('%d.%m.%Y %H:%M')}
                    Истек: {request.expires_at.strftime('%d.%m.%Y %H:%M')}
                    
                    Ваш личный кабинет: https://miniapp.expert/cabinet.html#referral-requests
                    ''',
                    recipient_list=[request.referrer.email],
                )
        
        logger.info(f"Processed {count} expired cancellation requests")
        return {
            'success': True,
            'processed': count,
            'message': f'Processed {count} expired requests'
        }
        
    except Exception as e:
        logger.error(f"Error processing expired cancellation requests: {e}")
        raise self.retry(exc=e, countdown=300)  # Retry in 5 minutes


@shared_task(bind=True)
def send_cancellation_reminders(self):
    """
    Отправляет напоминания рефералам о запросах, которые скоро истекут.
    
    Напоминание отправляется за 6 часов до истечения.
    Запускается каждый час через Celery Beat.
    """
    from .models_cancellation import CancellationRequest
    from apps.users.tasks import send_email_task
    
    try:
        # Найти запросы, которые истекают через 6 часов или меньше
        # И напоминание еще не было отправлено
        reminder_threshold = timezone.now() + timedelta(hours=6)
        
        requests_needing_reminder = CancellationRequest.objects.filter(
            status='pending',
            reminder_sent=False,
            referrer__isnull=False,
            expires_at__lte=reminder_threshold,
            expires_at__gt=timezone.now()
        ).select_related('user_product', 'requested_by', 'referrer')
        
        count = 0
        for request in requests_needing_reminder:
            time_left = request.time_left
            
            logger.info(
                f"Sending reminder for request #{request.id} to {request.referrer.email} "
                f"(time left: {time_left})"
            )
            
            send_email_task.delay(
                subject=f'Напоминание: Запрос на отмену подписки (осталось {time_left})',
                message=f'''
                Здравствуйте, {request.referrer.get_full_name()}!
                
                Напоминаем, что ваш реферал {request.requested_by.email} запросил отмену подписки "{request.user_product.product.name}".
                
                У вас осталось {time_left} для принятия решения.
                
                Если вы не примете решение, подписка будет автоматически отменена.
                
                Принять решение: https://miniapp.expert/cabinet.html#referral-requests
                ''',
                recipient_list=[request.referrer.email],
            )
            
            request.reminder_sent = True
            request.save()
            count += 1
        
        logger.info(f"Sent {count} reminders")
        return {
            'success': True,
            'sent': count,
            'message': f'Sent {count} reminders'
        }
        
    except Exception as e:
        logger.error(f"Error sending cancellation reminders: {e}")
        return {
            'success': False,
            'error': str(e)
        }

