"""
Serializers для запросов на отмену подписки
"""
from rest_framework import serializers
from .models_cancellation import CancellationRequest
from apps.products.models import UserProduct


class CancellationRequestSerializer(serializers.ModelSerializer):
    """Serializer для запроса на отмену"""
    
    user_email = serializers.EmailField(source='requested_by.email', read_only=True)
    user_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    referrer_email = serializers.EmailField(source='referrer.email', read_only=True)
    referrer_name = serializers.CharField(source='referrer.get_full_name', read_only=True)
    product_name = serializers.CharField(source='user_product.product.name', read_only=True)
    time_left = serializers.CharField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = CancellationRequest
        fields = [
            'id',
            'user_product',
            'requested_by',
            'user_email',
            'user_name',
            'referrer',
            'referrer_email',
            'referrer_name',
            'product_name',
            'status',
            'cancellation_reason',
            'decided_by',
            'decided_at',
            'decision_comment',
            'created_at',
            'expires_at',
            'time_left',
            'is_expired',
            'referrer_notified',
        ]
        read_only_fields = [
            'id',
            'requested_by',
            'referrer',
            'status',
            'decided_by',
            'decided_at',
            'created_at',
            'expires_at',
            'referrer_notified',
        ]


class CancellationRequestCreateSerializer(serializers.Serializer):
    """Serializer для создания запроса на отмену"""
    
    user_product_id = serializers.UUIDField(required=True)
    cancellation_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000
    )
    
    def validate_user_product_id(self, value):
        """Проверка что подписка существует и принадлежит пользователю"""
        user = self.context['request'].user
        
        try:
            user_product = UserProduct.objects.get(
                id=value,
                user=user,
                product__product_type='subscription',
                status='active'
            )
        except UserProduct.DoesNotExist:
            raise serializers.ValidationError(
                'Активная подписка не найдена'
            )
        
        # Проверить что нет активного запроса на отмену
        existing_request = CancellationRequest.objects.filter(
            user_product=user_product,
            status='pending'
        ).first()
        
        if existing_request:
            raise serializers.ValidationError(
                f'Запрос на отмену уже существует (ожидает решения реферала). '
                f'Осталось: {existing_request.time_left}'
            )
        
        return value


class CancellationDecisionSerializer(serializers.Serializer):
    """Serializer для принятия решения по запросу"""
    
    decision = serializers.ChoiceField(
        choices=['approve', 'reject'],
        required=True
    )
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500
    )

