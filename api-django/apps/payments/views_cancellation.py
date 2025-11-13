"""
Views для запросов на отмену подписки
"""
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models_cancellation import CancellationRequest
from .serializers_cancellation import (
    CancellationRequestSerializer,
    CancellationRequestCreateSerializer,
    CancellationDecisionSerializer,
)
from apps.products.models import UserProduct
from apps.affiliates.models import Referral
from apps.users.tasks import send_email_task
import logging

logger = logging.getLogger(__name__)


class CancellationRequestCreateView(views.APIView):
    """Создание запроса на отмену подписки"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Пользователь запрашивает отмену подписки.
        Запрос отправляется рефералу для принятия решения.
        """
        serializer = CancellationRequestCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_product_id = serializer.validated_data['user_product_id']
        cancellation_reason = serializer.validated_data.get('cancellation_reason', '')
        
        try:
            user_product = UserProduct.objects.get(
                id=user_product_id,
                user=request.user
            )
            
            # Найти реферала пользователя
            referral = Referral.objects.filter(referred_user=request.user).first()
            referrer = referral.referrer if referral else None
            
            # Создать запрос на отмену
            cancellation_request = CancellationRequest.objects.create(
                user_product=user_product,
                requested_by=request.user,
                referrer=referrer,
                cancellation_reason=cancellation_reason,
                status='pending'
            )
            
            logger.info(
                f"Создан запрос на отмену #{cancellation_request.id} "
                f"от {request.user.email} для подписки {user_product.id}"
            )
            
            # Отправить email реферал у (если есть)
            if referrer:
                send_email_task.delay(
                    subject=f'Запрос на отмену подписки от {request.user.email}',
                    message=f'''
                    Здравствуйте, {referrer.get_full_name()}!
                    
                    Ваш реферал {request.user.email} запросил отмену подписки "{user_product.product.name}".
                    
                    Причина: {cancellation_reason or "Не указана"}
                    
                    У вас есть 24 часа, чтобы принять решение:
                    - Одобрить отмену (подписка будет отменена)
                    - Отклонить отмену (подписка сохранится)
                    
                    Если вы не примете решение в течение 24 часов, подписка будет автоматически отменена.
                    
                    Принять решение: https://miniapp.expert/cabinet.html#referral-requests
                    ''',
                    recipient_list=[referrer.email],
                )
                cancellation_request.referrer_notified = True
                cancellation_request.save()
            
            # Вернуть созданный запрос
            result_serializer = CancellationRequestSerializer(cancellation_request)
            
            return Response({
                'success': True,
                'message': 'Запрос на отмену отправлен. Ваш реферал примет решение в течение 24 часов.',
                'request': result_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except UserProduct.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Подписка не найдена'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating cancellation request: {e}")
            return Response({
                'success': False,
                'error': 'Ошибка при создании запроса на отмену'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MyCancellationRequestsView(views.APIView):
    """Список моих запросов на отмену"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получить список запросов на отмену от текущего пользователя"""
        requests_queryset = CancellationRequest.objects.filter(
            requested_by=request.user
        ).select_related(
            'user_product__product',
            'referrer',
            'decided_by'
        )
        
        serializer = CancellationRequestSerializer(requests_queryset, many=True)
        
        return Response({
            'success': True,
            'requests': serializer.data
        })


class ReferralCancellationRequestsView(views.APIView):
    """Список запросов на отмену от моих рефералов"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получить список запросов, где я реферал"""
        requests_queryset = CancellationRequest.objects.filter(
            referrer=request.user
        ).select_related(
            'user_product__product',
            'requested_by',
            'decided_by'
        )
        
        # Разделить на активные и завершенные
        pending_requests = requests_queryset.filter(status='pending')
        completed_requests = requests_queryset.exclude(status='pending')
        
        pending_serializer = CancellationRequestSerializer(pending_requests, many=True)
        completed_serializer = CancellationRequestSerializer(completed_requests, many=True)
        
        return Response({
            'success': True,
            'pending': pending_serializer.data,
            'completed': completed_serializer.data
        })


class CancellationRequestDecisionView(views.APIView):
    """Принятие решения по запросу на отмену (только реферал)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, request_id):
        """
        Реферал принимает решение: одобрить или отклонить отмену.
        """
        try:
            cancellation_request = CancellationRequest.objects.select_related(
                'user_product',
                'requested_by',
                'referrer'
            ).get(
                id=request_id,
                referrer=request.user,
                status='pending'
            )
        except CancellationRequest.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Запрос не найден или вы не имеете прав на принятие решения'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Проверить что запрос не истек
        if cancellation_request.is_expired:
            return Response({
                'success': False,
                'error': 'Срок принятия решения истек. Подписка отменена автоматически.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Валидация данных
        serializer = CancellationDecisionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        decision = serializer.validated_data['decision']
        comment = serializer.validated_data.get('comment', '')
        
        try:
            with transaction.atomic():
                if decision == 'approve':
                    cancellation_request.approve(request.user, comment)
                    message = 'Отмена одобрена. Подписка отменена.'
                    logger.info(
                        f"Запрос #{cancellation_request.id} одобрен реферером {request.user.email}"
                    )
                else:  # reject
                    cancellation_request.reject(request.user, comment)
                    message = 'Отмена отклонена. Подписка сохранена.'
                    logger.info(
                        f"Запрос #{cancellation_request.id} отклонен реферером {request.user.email}"
                    )
                
                # Уведомить пользователя
                user_email = cancellation_request.requested_by.email
                send_email_task.delay(
                    subject='Решение по вашему запросу на отмену подписки',
                    message=f'''
                    Здравствуйте, {cancellation_request.requested_by.get_full_name()}!
                    
                    Ваш реферал принял решение по вашему запросу на отмену подписки "{cancellation_request.user_product.product.name}":
                    
                    Решение: {message}
                    Комментарий: {comment or "Без комментария"}
                    
                    Ваш личный кабинет: https://miniapp.expert/cabinet.html
                    ''',
                    recipient_list=[user_email],
                )
                
                result_serializer = CancellationRequestSerializer(cancellation_request)
                
                return Response({
                    'success': True,
                    'message': message,
                    'request': result_serializer.data
                })
                
        except Exception as e:
            logger.error(f"Error processing cancellation decision: {e}")
            return Response({
                'success': False,
                'error': 'Ошибка при обработке решения'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

