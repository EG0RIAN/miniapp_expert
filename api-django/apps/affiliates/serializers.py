from rest_framework import serializers
from .models import Referral, ReferralPayout, ReferralCommission
from apps.users.serializers import UserListSerializer
from apps.orders.serializers import OrderListSerializer


class ReferralSerializer(serializers.ModelSerializer):
    referrer = UserListSerializer(read_only=True)
    referred_user = UserListSerializer(read_only=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'referrer', 'referred_user', 'status',
            'commission_rate', 'total_earned', 'paid_out',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_earned', 'paid_out', 'created_at', 'updated_at']


class ReferralPayoutSerializer(serializers.ModelSerializer):
    referrer = UserListSerializer(read_only=True)
    
    class Meta:
        model = ReferralPayout
        fields = [
            'id', 'referrer', 'amount', 'currency', 'status',
            'payment_method', 'payment_ref', 'notes',
            'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReferralCommissionSerializer(serializers.ModelSerializer):
    referral = ReferralSerializer(read_only=True)
    order = OrderListSerializer(read_only=True)
    payout = ReferralPayoutSerializer(read_only=True)
    
    class Meta:
        model = ReferralCommission
        fields = [
            'id', 'referral', 'order', 'amount',
            'commission_rate', 'commission_amount', 'status',
            'payout', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

