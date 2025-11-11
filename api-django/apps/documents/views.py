"""
Views для отображения документов
"""
from django.shortcuts import render, get_object_or_404
from django.http import Http404
from django.views.decorators.cache import cache_page
from .models import Document


def document_view(request, document_type=None, slug=None):
    """View для отображения документа"""
    try:
        if document_type:
            # Поиск по типу документа
            document = Document.objects.filter(
                document_type=document_type,
                is_active=True,
                is_published=True
            ).first()
            if not document:
                raise Http404("Документ не найден")
        elif slug:
            # Поиск по slug
            document = Document.objects.filter(
                slug=slug,
                is_active=True,
                is_published=True
            ).first()
            if not document:
                raise Http404("Документ не найден")
        else:
            raise Http404("Документ не найден")
    except Exception as e:
        raise Http404("Документ не найден")
    
    context = {
        'document': document,
        'title': document.meta_title or document.title,
        'meta_description': document.meta_description,
    }
    
    return render(request, 'documents/document.html', context)


def privacy_view(request):
    """View для политики конфиденциальности"""
    return document_view(request, document_type='privacy')


def affiliate_terms_view(request):
    """View для условий партнерской программы"""
    return document_view(request, document_type='affiliate_terms')


def cabinet_terms_view(request):
    """View для условий использования личного кабинета"""
    return document_view(request, document_type='cabinet_terms')


def subscription_terms_view(request):
    """View для условий подписки"""
    return document_view(request, document_type='subscription_terms')

