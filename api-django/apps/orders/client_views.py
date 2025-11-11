from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.utils import timezone
from .models import Order
from .serializers import OrderSerializer, OrderListSerializer


class ClientOrdersView(views.APIView):
    """Список заказов пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        orders = Order.objects.filter(user=request.user).select_related('product').order_by('-created_at')
        
        # Фильтрация по статусу
        status_filter = request.query_params.get('status')
        if status_filter:
            orders = orders.filter(status=status_filter)
        
        serializer = OrderListSerializer(orders, many=True)
        return Response({
            'success': True,
            'orders': serializer.data,
            'total': orders.count()
        })


class ClientOrderDetailView(views.APIView):
    """Детали заказа пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            serializer = OrderSerializer(order)
            return Response({
                'success': True,
                'order': serializer.data
            })
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

