import { useLanguage } from '../contexts/LanguageContext'
import './SuccessPage.css'

const SuccessPage = ({ onNext }: { onNext?: () => void } = {}) => {
  const { t } = useLanguage()
  return (
    <div className="success-page">
      <div className="success-page__container">
        <div className="success-icon">
          <div className="success-checkmark">
            <div className="checkmark-circle">
              <div className="checkmark-stem"></div>
              <div className="checkmark-kick"></div>
            </div>
          </div>
        </div>

        <div className="success-content">
          <h1>
            <p style={{ color: 'var(--tg-theme-button-color)' }}>{t.success.title1}</p>
            <p>{t.success.title2}</p>
          </h1>
          
          <p className="success-message">
            {t.success.message}
            <br />
            {t.success.messageContinue}
          </p>

          <div className="success-details">
            <div className="detail-item">
              <div className="detail-icon">⏰</div>
              <div className="detail-text">
                <strong>{t.success.detail1Title}</strong>
                <span>{t.success.detail1Value}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">💬</div>
              <div className="detail-text">
                <strong>{t.success.detail2Title}</strong>
                <span>{t.success.detail2Value}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">📋</div>
              <div className="detail-text">
                <strong>{t.success.detail3Title}</strong>
                <span>{t.success.detail3Value}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SuccessPage
