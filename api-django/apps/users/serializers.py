from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    referrals_count = serializers.IntegerField(source='referrals.count', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'phone', 'telegram_id',
            'email_verified', 'referral_code', 'referred_by',
            'referrals_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'referral_code', 'created_at', 'updated_at']


class UserListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка пользователей"""
    referrals_count = serializers.IntegerField(source='referrals.count', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'phone',
            'email_verified', 'referral_code', 'referrals_count', 'created_at'
        ]

