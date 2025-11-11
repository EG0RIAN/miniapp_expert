from rest_framework import serializers
from .models import Product, UserProduct


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'slug', 'price', 'currency',
            'product_type', 'subscription_period', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserProductSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = UserProduct
        fields = [
            'id', 'user', 'product', 'status',
            'start_date', 'end_date', 'renewal_price',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

