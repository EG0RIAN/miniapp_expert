from rest_framework import serializers
from .models import PreOrder, Order
from apps.products.serializers import ProductSerializer
from apps.users.serializers import UserSerializer


class PreOrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = PreOrder
        fields = ['id', 'product', 'amount', 'currency', 'referral_code', 'expires_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'product', 'user', 'amount', 'currency', 'status',
            'description', 'customer_name', 'customer_email', 'customer_phone',
            'payment_id', 'payment_url', 'subscription_agreed', 'referral_code',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_id', 'created_at', 'updated_at']


class OrderListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка заказов"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'user_email', 'product_name',
            'amount', 'currency', 'status',
            'customer_name', 'customer_email', 'customer_phone',
            'created_at'
        ]
