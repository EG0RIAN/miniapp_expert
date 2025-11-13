"""
API views для документов (для админки)
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document
from .serializers import DocumentSerializer, DocumentPublicSerializer


class IsAdmin(permissions.BasePermission):
    """Проверка прав администратора"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class DocumentAdminViewSet(viewsets.ModelViewSet):
    """ViewSet для управления документами через API"""
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['document_type', 'is_active', 'is_published']
    search_fields = ['title', 'content_text', 'meta_title', 'meta_description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-updated_at']
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def public(self, request):
        """Публичный API для получения документов"""
        queryset = Document.objects.filter(is_active=True, is_published=True)
        document_type = request.query_params.get('type', None)
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        serializer = DocumentPublicSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def public_detail(self, request, pk=None):
        """Публичный API для получения конкретного документа"""
        document = self.get_object()
        if not document.is_active or not document.is_published:
            return Response({'error': 'Документ не найден'}, status=404)
        serializer = DocumentPublicSerializer(document, context={'request': request})
        return Response(serializer.data)

