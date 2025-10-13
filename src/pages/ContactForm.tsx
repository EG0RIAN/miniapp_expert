import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { useLanguage } from '../contexts/LanguageContext'
import './ContactForm.css'
import SuccessPage from './SuccessPage'

const ContactForm = ({ onNext, onBack }: { onNext?: () => void, onBack?: () => void } = {}) => {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    telegramNick: '',
    phone: ''
  })
  const [errors, setErrors] = useState({
    telegramNick: '',
    phone: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Получаем данные из Telegram
  useEffect(() => {
    try {
      const user = WebApp.initDataUnsafe?.user
      
      console.log('Telegram User Data:', user)
      
      if (user) {
        // Формируем никнейм из данных пользователя
        let telegramNick = ''
        
        if (user.username) {
          telegramNick = `@${user.username}`
        } else if (user.first_name || user.last_name) {
          telegramNick = [user.first_name, user.last_name].filter(Boolean).join(' ')
        }
        
        if (telegramNick) {
          setFormData(prev => ({
            ...prev,
            telegramNick
          }))
        }
      } else {
        console.warn('Нет данных пользователя Telegram')
      }
    } catch (error) {
      console.error('Ошибка получения данных Telegram:', error)
    }
  }, [])

  // Показываем кнопку "Назад" в Telegram
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp && !showSuccess) {
      const tg = window.Telegram.WebApp
      
      tg.BackButton.show()
      
      const handleBack = () => {
        if (onBack) {
          onBack()
        }
      }
      
      tg.BackButton.onClick(handleBack)
      
      return () => {
        tg.BackButton.offClick(handleBack)
        tg.BackButton.hide()
      }
    }
  }, [onBack, showSuccess])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Очищаем ошибку при вводе
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {
      telegramNick: '',
      phone: ''
    }

    // Проверяем номер телефона (обязательное поле)
    if (!formData.phone.trim()) {
      newErrors.phone = t.contact.errorPhoneRequired
    } else if (!/^[\+]?[1-9][\d\s\-\(\)]{7,20}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t.contact.errorPhone
    }

    setErrors(newErrors)
    return !newErrors.telegramNick && !newErrors.phone
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Попытка отправки формы:', formData)
    
    if (!validateForm()) {
      console.log('Валидация не прошла')
      return
    }
    
    console.log('Валидация успешна, начинаем отправку...')

    setIsSubmitting(true)
    
    try {
      // Собираем все данные пользователя
      const user = WebApp.initDataUnsafe?.user
      
      // Формируем данные для API в нужном формате
      const leadData = {
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: formData.phone,
        telegram: formData.telegramNick || user?.username || '',
        client_language: user?.language_code || 'ru',
        description: `Заявка из Telegram Mini App. Platform: ${WebApp.platform}, User ID: ${user?.id}`,
        comment: JSON.stringify({
          telegram_user_id: user?.id,
          username: user?.username,
          is_premium: user?.is_premium,
          platform: WebApp.platform,
          version: WebApp.version,
          colorScheme: WebApp.colorScheme,
          timestamp: new Date().toISOString()
        })
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📤 ОТПРАВКА ЗАЯВКИ НАПРЯМУЮ НА API')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📊 Данные для отправки:', leadData)
      console.log('📄 JSON:', JSON.stringify(leadData, null, 2))
      console.log('')
      
      // Получаем данные из .env
      const apiUrl = import.meta.env.VITE_API_URL || 'https://arkhiptsev.com/api/leads/create/'
      const apiToken = import.meta.env.VITE_API_TOKEN || 'caWiO1suYRE1CqspQPdJjcOJx3LH5S8m5LndimxdyJwWfyWa22wGDzcNsmvb5kMt'
      
      console.log('🔧 API URL:', apiUrl)
      console.log('🔧 Token exists:', !!apiToken)
      console.log('')
      
      try {
        console.log('📡 Отправка на API...')
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(leadData)
        })
        
        console.log('📡 Response status:', response.status)
        
        if (response.ok) {
          const responseData = await response.json()
          console.log('✅ Успешный ответ от API:', responseData)
          console.log('✅ Заявка создана! ID:', responseData.lead_id)
          
          // Показываем страницу успеха
          setShowSuccess(true)
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ Ошибка API:', response.status, errorData)
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
      } catch (fetchError: any) {
        console.error('❌ Ошибка отправки:', fetchError)
        throw fetchError
      }
      
    } catch (error: any) {
      console.error('Ошибка отправки:', error)
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
      
      // Проверяем, это ошибка сети или что-то другое
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Ошибка сети - возможно CORS')
        alert('Ошибка сети. Данные могут быть отправлены, проверьте webhook.site')
        // Показываем страницу успеха даже при ошибке (данные могли уйти)
        setShowSuccess(true)
      } else {
        alert(`Произошла ошибка: ${error?.message || 'Неизвестная ошибка'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return <SuccessPage onNext={onNext} />
  }

  return (
    <div className="contact-form page">
      <div className="contact-form__container">
        <div className="contact-form__title">
          <h1>
            <p style={{ color: 'var(--tg-theme-button-color)' }}>{t.contact.title1}</p>
            <p>{t.contact.title2}</p>
          </h1>
          <p>
            {t.contact.subtitle}
            <span style={{ fontWeight: 600, fontSize: '18px', lineHeight: '24px' }}>
              {' '}{t.contact.subtitleBold}
            </span>
          </p>
        </div>

        <form className="contact-form__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="telegramNick" className="form-label">
              {t.contact.telegramLabel}
            </label>
            <input
              type="text"
              id="telegramNick"
              name="telegramNick"
              value={formData.telegramNick}
              onChange={handleInputChange}
              placeholder={t.contact.telegramPlaceholder}
              className={`form-input ${errors.telegramNick ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.telegramNick && (
              <span className="error-message">{errors.telegramNick}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              {t.contact.phoneLabel} <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+7 (999) 123-45-67"
              className={`form-input ${errors.phone ? 'error' : ''}`}
              disabled={isSubmitting}
              required
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          <button 
            type="submit" 
            className={`submit-button ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span>Отправляем...</span>
                <div className="loading-spinner"></div>
              </>
            ) : (
              <>
                <span>{t.contact.submitButton}</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ContactForm
