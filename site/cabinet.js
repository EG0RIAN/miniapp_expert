// ... existing code ...

// Check documents status (for banner on all pages)
async function checkDocumentsStatus() {
    try {
        const result = await apiRequest('/client/documents/');
        if (!result || result.error) {
            return;
        }
        
        const documentsToSign = result.data.documents_to_sign || [];
        const signedDocuments = result.data.signed_documents || [];
        
        // Show/hide banner if there are documents to sign
        const banner = document.getElementById('documentsToSignBanner');
        const bannerList = document.getElementById('documentsToSignList');
        
        if (documentsToSign.length > 0) {
            if (banner) {
                banner.classList.remove('hidden');
            }
            if (bannerList) {
                bannerList.innerHTML = documentsToSign.map(doc => {
                    const documentTypeLabels = {
                        'privacy': 'Политика конфиденциальности',
                        'affiliate_terms': 'Условия партнерской программы',
                        'cabinet_terms': 'Условия использования личного кабинета',
                        'subscription_terms': 'Условия подписки',
                    };
                    const label = documentTypeLabels[doc.document_type] || doc.title;
                    const hasNewVersion = doc.is_signed && doc.signed_version < doc.current_version;
                    
                    return `
                        <div class="bg-white rounded-lg p-3 border border-yellow-300 mb-2">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <h4 class="font-semibold text-gray-900 text-sm">${label}</h4>
                                    ${hasNewVersion ? `
                                        <p class="text-xs text-gray-600 mt-1">
                                            Подписана версия ${doc.signed_version}, доступна версия ${doc.current_version}
                                        </p>
                                    ` : `
                                        <p class="text-xs text-gray-600 mt-1">Требуется подпись</p>
                                    `}
                                </div>
                                <button 
                                    onclick="signDocument('${doc.document_type}')" 
                                    class="bg-yellow-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-700 transition text-xs ml-3 flex-shrink-0"
                                >
                                    Подписать
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } else {
            if (banner) {
                banner.classList.add('hidden');
            }
        }
        
        // Load signed documents in profile (if on profile page)
        const signedList = document.getElementById('signedDocumentsList');
        if (signedList) {
            await loadSignedDocumentsInProfile(signedDocuments);
        }
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error checking documents status:', error);
    }
}

// Load signed documents in profile section
async function loadSignedDocumentsInProfile(signedDocuments) {
    const signedList = document.getElementById('signedDocumentsList');
    if (!signedList) return;
    
    if (signedDocuments.length === 0) {
        signedList.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <i data-lucide="file-text" class="w-8 h-8 mx-auto mb-2 text-gray-300"></i>
                <p class="text-sm">Нет подписанных документов</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    signedList.innerHTML = signedDocuments.map(doc => {
        const documentTypeLabels = {
            'privacy': 'Политика конфиденциальности',
            'affiliate_terms': 'Условия партнерской программы',
            'cabinet_terms': 'Условия использования личного кабинета',
            'subscription_terms': 'Условия подписки',
        };
        const label = documentTypeLabels[doc.document_type] || doc.title;
        const signedDate = doc.signed_at ? new Date(doc.signed_at).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : '';
        
        const docUrls = {
            'privacy': '/privacy.html',
            'affiliate_terms': '/affiliate-terms.html',
            'cabinet_terms': '/cabinet-terms.html',
            'subscription_terms': '/subscription-terms.html',
        };
        const docUrl = docUrls[doc.document_type] || '#';
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i data-lucide="check-circle" class="w-4 h-4 text-green-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm text-gray-900 truncate">${label}</h4>
                        <p class="text-xs text-gray-600">Версия ${doc.current_version} · ${signedDate}</p>
                    </div>
                </div>
                <a 
                    href="${docUrl}" 
                    target="_blank"
                    class="text-primary hover:text-primary/80 font-semibold text-xs flex items-center gap-1 ml-2 flex-shrink-0"
                    title="Открыть документ"
                >
                    <i data-lucide="external-link" class="w-3 h-3"></i>
                </a>
            </div>
        `;
    }).join('');
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Sign document
async function signDocument(documentType) {
    if (!confirm('Вы уверены, что хотите подписать этот документ?')) {
        return;
    }
    
    try {
        const result = await apiRequest(`/client/documents/accept/${documentType}/`, {
            method: 'POST',
        });
        
        if (!result || result.error) {
            notifyError(result?.data?.message || 'Ошибка при подписании документа');
            return;
        }
        
        notifySuccess('Документ успешно подписан');
        
        // Reload documents status (banner and profile list)
        await checkDocumentsStatus();
        
        // If it's affiliate_terms, reload partners data
        if (documentType === 'affiliate_terms') {
            await loadPartnersData();
        }
    } catch (error) {
        console.error('Error signing document:', error);
        notifyError('Ошибка при подписании документа');
    }
}

// ... existing code ...
