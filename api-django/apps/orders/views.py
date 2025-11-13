from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta
from .models import PreOrder, Order
from apps.products.models import Product
from apps.users.models import User
from .serializers import PreOrderSerializer
from apps.documents.serializers import DocumentPublicSerializer


@method_decorator(csrf_exempt, name='dispatch')
class PreOrderCreateView(views.APIView):
    """Создание предзаказа с UUID"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        product_slug = request.data.get('product_slug')
        referral_code = request.data.get('referral_code')  # Реферальный код из URL
        
        if not product_slug:
            return Response(
                {'success': False, 'message': 'product_slug is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(slug=product_slug, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Найти реферера по коду
        referred_by = None
        if referral_code:
            try:
                referred_by = User.objects.get(referral_code=referral_code.upper())
            except User.DoesNotExist:
                # Реферальный код не найден, но продолжаем создание предзаказа
                pass
        
        # Создать предзаказ
        pre_order = PreOrder.objects.create(
            product=product,
            amount=product.price,
            currency=product.currency,
            referral_code=referral_code.upper() if referral_code else None,
            referred_by=referred_by,
            expires_at=timezone.now() + timedelta(hours=24),  # Действителен 24 часа
        )
        
        # Подготавливаем данные продукта с условиями подписки
        product_data = {
            'name': product.name,
            'description': product.description,
            'price': str(product.price),
            'currency': product.currency,
            'product_type': product.product_type,
            'subscription_period': product.subscription_period,
        }
        
        # Если есть условия подписки, добавляем их
        if product.subscription_terms:
            product_data['subscription_terms'] = DocumentPublicSerializer(
                product.subscription_terms,
                context={'request': request}
            ).data
        
        return Response({
            'success': True,
            'pre_order_id': str(pre_order.id),
            'product': product_data,
            'referral_code': pre_order.referral_code,
            'expires_at': pre_order.expires_at.isoformat(),
        })


@method_decorator(csrf_exempt, name='dispatch')
class PreOrderDetailView(views.APIView):
    """Получение информации о предзаказе по UUID"""
    permission_classes = [AllowAny]
    
    def get(self, request, pre_order_id):
        try:
            pre_order = PreOrder.objects.get(id=pre_order_id, is_used=False)
            
            # Проверить, не истек ли предзаказ
            if timezone.now() > pre_order.expires_at:
                return Response(
                    {'success': False, 'message': 'Pre-order expired'},
                    status=status.HTTP_410_GONE
                )
            
            # Подготавливаем данные продукта с условиями подписки
            product_data = {
                'name': pre_order.product.name,
                'description': pre_order.product.description,
                'price': str(pre_order.amount),
                'currency': pre_order.currency,
                'product_type': pre_order.product.product_type,
                'subscription_period': pre_order.product.subscription_period,
            }
            
            # Если есть условия подписки, добавляем их
            if pre_order.product.subscription_terms:
                product_data['subscription_terms'] = DocumentPublicSerializer(
                    pre_order.product.subscription_terms,
                    context={'request': request}
                ).data
            
            return Response({
                'success': True,
                'pre_order_id': str(pre_order.id),
                'product': product_data,
                'referral_code': pre_order.referral_code,
                'expires_at': pre_order.expires_at.isoformat(),
            })
        except PreOrder.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Pre-order not found or already used'},
                status=status.HTTP_404_NOT_FOUND
            )

