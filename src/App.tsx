import { useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { LanguageProvider } from './contexts/LanguageContext'
import Home from './pages/Home'
import './App.css'

function App() {
  useEffect(() => {
    // Инициализация Telegram WebApp
    WebApp.ready()
    WebApp.expand()
    
    // Применяем тему Telegram
    const applyTelegramTheme = () => {
      const isDark = WebApp.colorScheme === 'dark'
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
      
      // Применяем цвета Telegram к CSS переменным
      const root = document.documentElement
      const theme = WebApp.themeParams
      
      if (theme.bg_color) root.style.setProperty('--tg-theme-bg-color', theme.bg_color)
      if (theme.text_color) root.style.setProperty('--tg-theme-text-color', theme.text_color)
      if (theme.hint_color) root.style.setProperty('--tg-theme-hint-color', theme.hint_color)
      if (theme.link_color) root.style.setProperty('--tg-theme-link-color', theme.link_color)
      if (theme.button_color) root.style.setProperty('--tg-theme-button-color', theme.button_color)
      if (theme.button_text_color) root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color)
      if (theme.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color)
      
      // Устанавливаем цвета хедера и фона
      WebApp.setHeaderColor(theme.bg_color || (isDark ? '#212121' : '#ffffff'))
      WebApp.setBackgroundColor(theme.bg_color || (isDark ? '#212121' : '#ffffff'))
    }
    
    applyTelegramTheme()
    
    // Слушаем изменения темы
    WebApp.onEvent('themeChanged', applyTelegramTheme)
    
    // Включаем кнопку закрытия
    WebApp.enableClosingConfirmation()
    
    console.log('Telegram WebApp initialized:', {
      platform: WebApp.platform,
      version: WebApp.version,
      colorScheme: WebApp.colorScheme,
      themeParams: WebApp.themeParams,
      user: WebApp.initDataUnsafe.user
    })
    
    return () => {
      WebApp.offEvent('themeChanged', applyTelegramTheme)
    }
  }, [])

  return (
    <LanguageProvider>
      <div className="app">
        <div className="layout">
          <Home />
        </div>
      </div>
    </LanguageProvider>
  )
}

export default App

