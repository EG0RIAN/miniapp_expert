from .models import AuditLog
import json


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        return response
    
    @staticmethod
    def log(action, entity_type, entity_id, actor, before=None, after=None, request=None):
        """Создать запись в журнале аудита"""
        try:
            AuditLog.objects.create(
                entity_type=entity_type,
                entity_id=str(entity_id),
                action=action,
                actor=actor,
                actor_email=actor.email if actor else '',
                actor_role=actor.role if actor and hasattr(actor, 'role') else None,
                before=before,
                after=after,
                ip_address=request.META.get('REMOTE_ADDR') if request else None,
                user_agent=request.META.get('HTTP_USER_AGENT') if request else None,
            )
        except Exception as e:
            # Логируем ошибку, но не прерываем выполнение
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create audit log: {e}")

