"""
Client views для документов
"""
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Max
from .models import Document, DocumentAcceptance
from .serializers import DocumentPublicSerializer, DocumentAcceptanceSerializer


class ClientDocumentsView(views.APIView):
    """Управление подписанными документами пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получить список подписанных документов и документов с новыми версиями"""
        user = request.user
        
        # Получаем все активные опубликованные документы
        documents = Document.objects.filter(is_active=True, is_published=True)
        
        # Получаем последние принятые версии для каждого документа
        accepted_docs = DocumentAcceptance.objects.filter(
            user=user,
            document__in=documents
        ).values('document_id').annotate(
            max_version=Max('version')
        )
        
        accepted_dict = {item['document_id']: item['max_version'] for item in accepted_docs}
        
        # Формируем ответ
        signed_documents = []
        documents_to_sign = []
        
        for doc in documents:
            serializer = DocumentPublicSerializer(doc)
            doc_data = serializer.data
            
            # Проверяем, подписан ли документ
            accepted_version = accepted_dict.get(doc.id, None)
            
            if accepted_version is None:
                # Документ не подписан
                documents_to_sign.append({
                    **doc_data,
                    'is_signed': False,
                    'signed_version': None,
                    'current_version': doc.version,
                    'needs_signature': True,
                })
            elif accepted_version < doc.version:
                # Есть новая версия документа
                documents_to_sign.append({
                    **doc_data,
                    'is_signed': True,
                    'signed_version': accepted_version,
                    'current_version': doc.version,
                    'needs_signature': True,
                })
            else:
                # Документ подписан актуальной версией
                acceptance = DocumentAcceptance.objects.filter(
                    user=user,
                    document=doc,
                    version=accepted_version
                ).first()
                
                signed_documents.append({
                    **doc_data,
                    'is_signed': True,
                    'signed_version': accepted_version,
                    'current_version': doc.version,
                    'needs_signature': False,
                    'signed_at': acceptance.accepted_at.isoformat() if acceptance else None,
                })
        
        return Response({
            'success': True,
            'signed_documents': signed_documents,
            'documents_to_sign': documents_to_sign,
        })


class ClientDocumentAcceptView(views.APIView):
    """Принять (подписать) документ"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, document_type=None):
        """Принять документ текущей версии"""
        if not document_type:
            return Response(
                {'success': False, 'message': 'Document type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            document = Document.objects.get(
                document_type=document_type,
                is_active=True,
                is_published=True
            )
            
            user = request.user
            
            # Проверяем, не принят ли уже документ этой версии
            existing_acceptance = DocumentAcceptance.objects.filter(
                user=user,
                document=document,
                version=document.version
            ).first()
            
            if existing_acceptance:
                return Response({
                    'success': True,
                    'message': 'Документ уже принят',
                    'acceptance': DocumentAcceptanceSerializer(existing_acceptance).data
                })
            
            # Получаем IP адрес и User-Agent
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Создаем новую запись о принятии документа
            acceptance = DocumentAcceptance.objects.create(
                user=user,
                document=document,
                version=document.version,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            
            # Если это affiliate_terms, обновляем offer_accepted_at в User
            if document_type == 'affiliate_terms':
                user.offer_accepted_at = timezone.now()
                user.offer_version = str(document.version)
                user.save(update_fields=['offer_accepted_at', 'offer_version'])
            
            return Response({
                'success': True,
                'message': 'Документ успешно принят',
                'acceptance': DocumentAcceptanceSerializer(acceptance).data
            })
            
        except Document.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _get_client_ip(self, request):
        """Получить IP адрес клиента"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

