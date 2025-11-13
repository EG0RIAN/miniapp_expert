"""
Serializers для документов API
"""
from rest_framework import serializers
from .models import Document, DocumentAcceptance


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer для документа"""
    
    class Meta:
        model = Document
        fields = [
            'id',
            'document_type',
            'title',
            'slug',
            'content',
            'is_active',
            'is_published',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
            'published_at',
            'version',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'published_at', 'version']


class DocumentPublicSerializer(serializers.ModelSerializer):
    """Serializer для публичного API (без служебных полей)"""
    
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id',
            'document_type',
            'title',
            'slug',
            'content',
            'meta_title',
            'meta_description',
            'updated_at',
            'version',
            'url',
        ]
    
    def get_url(self, obj):
        request = self.context.get('request')
        absolute_url = obj.get_absolute_url()
        if request and absolute_url.startswith('/'):
            return request.build_absolute_uri(absolute_url)
        return absolute_url


class DocumentAcceptanceSerializer(serializers.ModelSerializer):
    """Serializer для принятых документов"""
    document = DocumentPublicSerializer(read_only=True)
    
    class Meta:
        model = DocumentAcceptance
        fields = [
            'id',
            'user',
            'document',
            'version',
            'accepted_at',
            'ip_address',
        ]
        read_only_fields = ['id', 'accepted_at']
