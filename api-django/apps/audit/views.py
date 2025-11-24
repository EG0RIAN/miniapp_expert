import logging

from rest_framework import status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import TrackingEvent

logger = logging.getLogger(__name__)


def _truncate(value, limit):
    if value is None:
        return ''
    value = str(value)
    if len(value) > limit:
        return value[:limit]
    return value


def _client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class TrackingEventView(views.APIView):
    """
    Получение фронтовых событий (page_view, click, custom events).
    Анонимно, без CSRF.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}
        nested_data = payload.get('data') if isinstance(payload.get('data'), dict) else {}
        event_name = payload.get('event') or 'custom_event'
        category = payload.get('category') or 'frontend'

        try:
            TrackingEvent.objects.create(
                event=_truncate(event_name, 100),
                category=_truncate(category, 50),
                session_id=_truncate(payload.get('sessionId') or payload.get('session_id'), 120),
                user_identifier=_truncate(payload.get('userId') or payload.get('user_id'), 120),
                page=_truncate(payload.get('page') or nested_data.get('page'), 255),
                referrer=_truncate(payload.get('referrer') or nested_data.get('referrer'), 512),
                cart_id=_truncate(payload.get('cartId') or nested_data.get('cartId'), 120),
                payload=nested_data or payload,
                ip_address=_client_ip(request),
                user_agent=_truncate(request.META.get('HTTP_USER_AGENT'), 512),
            )
        except Exception:
            logger.exception('Failed to persist tracking event')
            return Response({'success': False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'success': True}, status=status.HTTP_201_CREATED)


class CartTrackingView(views.APIView):
    """
    Отдельный endpoint для отслеживания статуса корзины/воронки.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}
        cart_id = payload.get('cartId') or payload.get('cart_id')
        status_label = payload.get('status') or payload.get('cartStatus')

        try:
            TrackingEvent.objects.create(
                event='cart_update',
                category='cart',
                session_id=_truncate(payload.get('sessionId') or payload.get('session_id'), 120),
                user_identifier=_truncate(payload.get('userId') or payload.get('user_id'), 120),
                cart_id=_truncate(cart_id, 120),
                cart_status=_truncate(status_label, 50),
                page=_truncate(payload.get('page'), 255),
                payload=payload,
                ip_address=_client_ip(request),
                user_agent=_truncate(request.META.get('HTTP_USER_AGENT'), 512),
            )
        except Exception:
            logger.exception('Failed to persist cart tracking event')
            return Response({'success': False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'success': True}, status=status.HTTP_201_CREATED)





