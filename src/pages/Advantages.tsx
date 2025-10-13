import { useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import './Advantages.css'

const Advantages = ({ onNext, onBack }: { onNext: () => void, onBack?: () => void }) => {
  const { t } = useLanguage()
  useEffect(() => {
    // Показываем кнопку "Назад" в Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
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
  }, [onBack])

  const handleNext = () => {
    onNext()
  }
  return (
    <div className="advantages page">
      <div className="advantages__container">
        <div className="advantages__title">
          <h1>
            <p style={{ color: 'var(--tg-theme-button-color)' }}>{t.advantages.title1}</p>
            <p>{t.advantages.title2}</p>
          </h1>
          <p>
            {t.advantages.subtitle}
            <span style={{ fontWeight: 600, fontSize: '18px', lineHeight: '24px' }}>
              {' '}{t.advantages.subtitleBold}
            </span>
          </p>
        </div>

        <div className="advantages__grid">
          <div className="advantage-card">
            <div className="advantage-icon">⚡</div>
            <h3>{t.advantages.advantage1.title}</h3>
            <p>{t.advantages.advantage1.description}</p>
          </div>
          
          <div className="advantage-card">
            <div className="advantage-icon">💰</div>
            <h3>{t.advantages.advantage2.title}</h3>
            <p>{t.advantages.advantage2.description}</p>
          </div>
          
          <div className="advantage-card">
            <div className="advantage-icon">📱</div>
            <h3>{t.advantages.advantage3.title}</h3>
            <p>{t.advantages.advantage3.description}</p>
          </div>
          
          <div className="advantage-card">
            <div className="advantage-icon">🔧</div>
            <h3>{t.advantages.advantage4.title}</h3>
            <p>{t.advantages.advantage4.description}</p>
          </div>
        </div>

        <button className="next-button" onClick={handleNext}>
          {t.advantages.nextButton}
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

export default Advantages
