from rest_framework import serializers
from .models import Order
from apps.users.serializers import UserSerializer
from apps.products.serializers import ProductSerializer


class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'user', 'product',
            'amount', 'currency', 'status', 'description',
            'customer_name', 'customer_email', 'customer_phone',
            'payment_id', 'payment_url', 'subscription_agreed', 'subscription_agreed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_id', 'created_at', 'updated_at', 'payment_id', 'payment_url']


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

