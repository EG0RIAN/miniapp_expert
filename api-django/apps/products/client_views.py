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


class CancelSubscriptionView(views.APIView):
    """Отмена подписки"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, subscription_id):
        try:
            user_product = UserProduct.objects.get(
                id=subscription_id,
                user=request.user,
                product__product_type='subscription'
            )
        except UserProduct.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Подписка не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, что подписка активна
        if user_product.status != 'active':
            return Response(
                {'success': False, 'message': 'Подписка не активна'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Отменяем подписку - меняем статус на cancelled
        # Подписка будет действовать до конца текущего периода (end_date)
        user_product.status = 'cancelled'
        user_product.save()
        
        return Response({
            'success': True,
            'message': 'Подписка отменена. Она будет действовать до окончания текущего периода оплаты.'
        })

