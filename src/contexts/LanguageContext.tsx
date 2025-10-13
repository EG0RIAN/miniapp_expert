import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import WebApp from '@twa-dev/sdk'
import { getTranslations } from '../i18n/translations'

interface LanguageContextType {
  t: ReturnType<typeof getTranslations>
  language: string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('ru')
  const [t, setT] = useState(() => getTranslations('ru'))

  useEffect(() => {
    // Получаем язык из Telegram
    const userLanguage = WebApp.initDataUnsafe?.user?.language_code || 'ru'
    console.log('🌍 User language from Telegram:', userLanguage)
    console.log('🌍 WebApp.initDataUnsafe:', WebApp.initDataUnsafe)
    
    setLanguage(userLanguage)
    const translations = getTranslations(userLanguage)
    console.log('🌍 Loaded translations for:', userLanguage, translations)
    setT(translations)
  }, [])

  return (
    <LanguageContext.Provider value={{ t, language }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

