from rest_framework import serializers
from .models import Product, UserProduct
from apps.documents.serializers import DocumentPublicSerializer


class ProductSerializer(serializers.ModelSerializer):
    subscription_terms = DocumentPublicSerializer(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'slug', 'price', 'currency',
            'product_type', 'subscription_period', 'subscription_terms', 
            'admin_url', 'is_active',
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
            'app_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

