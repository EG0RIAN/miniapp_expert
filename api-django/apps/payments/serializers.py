from rest_framework import serializers
from .models import Payment, ManualCharge, Transaction, PaymentMethod, Mandate
from apps.users.serializers import UserSerializer
from apps.orders.serializers import OrderListSerializer


class PaymentSerializer(serializers.ModelSerializer):
    order = OrderListSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'user',
            'amount', 'currency', 'status', 'method',
            'provider_ref', 'failure_reason', 'receipt_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ManualChargeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    initiator = UserSerializer(read_only=True)
    
    class Meta:
        model = ManualCharge
        fields = [
            'id', 'user', 'amount', 'currency', 'reason', 'channel',
            'status', 'provider_ref', 'failure_reason',
            'initiator', 'payment_method', 'mandate', 'idempotency_key',
            'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'provider_ref', 'failure_reason', 'processed_at', 'created_at', 'updated_at', 'initiator']


class TransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    order = OrderListSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'order', 'payment', 'manual_charge',
            'transaction_type', 'amount', 'currency', 'description',
            'provider_ref', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PaymentMethodSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'user', 'provider', 'rebill_id', 'pan_mask',
            'exp_date', 'card_type', 'status', 'is_default',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MandateSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Mandate
        fields = [
            'id', 'user', 'type', 'bank', 'mandate_number',
            'signed_at', 'status', 'file_url', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

