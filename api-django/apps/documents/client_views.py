"""
Client views для документов
"""
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Max, Q
from .models import Document, DocumentAcceptance
from .serializers import DocumentPublicSerializer, DocumentAcceptanceSerializer


class ClientDocumentsView(views.APIView):
    """Управление подписанными документами пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получить список подписанных документов и документов с новыми версиями"""
        user = request.user
        
        # Получаем документы, которые должны быть уникальными (privacy, cabinet_terms, affiliate_terms)
        # Для subscription_terms не возвращаем все документы, так как они привязаны к продуктам
        # Пользователь должен подписывать subscription_terms через продукт при оформлении подписки
        # subscription_terms документы показываются только если у пользователя есть активные подписки на продукты с этими документами
        unique_document_types = ['privacy', 'cabinet_terms', 'affiliate_terms']
        documents = []
        
        for doc_type in unique_document_types:
            doc = Document.objects.filter(
                document_type=doc_type,
                is_active=True,
                is_published=True
            ).first()
            if doc:
                documents.append(doc)
        
        # Получаем subscription_terms документы только для продуктов, на которые у пользователя есть активные подписки
        from apps.products.models import UserProduct
        user_subscriptions = UserProduct.objects.filter(
            user=user,
            status='active',
            product__product_type='subscription',
            product__subscription_terms__isnull=False
        ).select_related('product', 'product__subscription_terms')
        
        # Получаем уникальные subscription_terms документы из активных подписок
        subscription_terms_docs = []
        seen_subscription_terms_ids = set()
        
        for user_sub in user_subscriptions:
            if user_sub.product and user_sub.product.subscription_terms:
                subscription_terms_doc = user_sub.product.subscription_terms
                # Добавляем только если документ активен, опубликован и еще не добавлен
                if (subscription_terms_doc.is_active and 
                    subscription_terms_doc.is_published and 
                    subscription_terms_doc.id not in seen_subscription_terms_ids):
                    subscription_terms_docs.append(subscription_terms_doc)
                    seen_subscription_terms_ids.add(subscription_terms_doc.id)
        
        # Добавляем subscription_terms документы к общему списку документов
        documents.extend(subscription_terms_docs)
        
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
        
        serializer_context = {'request': request}
        
        for doc in documents:
            serializer = DocumentPublicSerializer(doc, context=serializer_context)
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
        """Принять документ текущей версии
        
        Параметры:
        - document_type: тип документа (из URL)
        - document_id: ID документа (из body, опционально, для subscription_terms с разными документами)
        """
        user = request.user
        
        # Получаем document_id из body, если передан (для subscription_terms с разными документами)
        document_id = request.data.get('document_id')
        
        try:
            if document_id:
                # Если передан document_id, используем его (для subscription_terms с разными документами)
                document = Document.objects.get(
                    id=document_id,
                    is_active=True,
                    is_published=True
                )
            elif document_type:
                # Если передан document_type, используем его (для остальных типов документов)
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
            else:
                return Response(
                    {'success': False, 'message': 'Document type or document_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
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
            if document.document_type == 'affiliate_terms':
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
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Error accepting document: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_client_ip(self, request):
        """Получить IP адрес клиента"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

