"""
Публичные API views для документов
"""
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Document
from .serializers import DocumentPublicSerializer


class PublicDocumentView(views.APIView):
    """Публичный API для получения документов"""
    permission_classes = [AllowAny]
    
    def get(self, request, document_type=None):
        """
        Получить документ по типу
        
        Параметры:
        - document_type: тип документа (privacy, affiliate_terms, cabinet_terms, subscription_terms)
        """
        if document_type:
            try:
                document = Document.objects.filter(
                    document_type=document_type,
                    is_active=True,
                    is_published=True
                ).first()
                
                if not document:
                    return Response(
                        {'success': False, 'message': 'Document not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                serializer = DocumentPublicSerializer(document, context={'request': request})
                return Response({
                    'success': True,
                    'document': serializer.data
                })
            except Exception as e:
                print(f"Error loading document {document_type}: {e}")
                return Response(
                    {'success': False, 'message': f'Error loading document: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # Возвращаем все опубликованные документы
            documents = Document.objects.filter(
                is_active=True,
                is_published=True
            )
            serializer = DocumentPublicSerializer(documents, many=True, context={'request': request})
            return Response({
                'success': True,
                'documents': serializer.data
            })

