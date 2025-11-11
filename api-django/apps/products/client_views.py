from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Product, UserProduct
from .serializers import ProductSerializer, UserProductSerializer


class ClientProductsView(views.APIView):
    """Список продуктов пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_products = UserProduct.objects.filter(user=request.user).select_related('product')
        serializer = UserProductSerializer(user_products, many=True)
        return Response({
            'success': True,
            'products': serializer.data
        })


class AvailableProductsView(views.APIView):
    """Список доступных продуктов для покупки"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        products = Product.objects.filter(is_active=True)
        serializer = ProductSerializer(products, many=True)
        return Response({
            'success': True,
            'products': serializer.data
        })

