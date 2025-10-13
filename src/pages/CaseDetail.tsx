import { useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import './CaseDetail.css'
import { CaseData } from './Cases'

interface CaseDetailProps {
  caseData: CaseData
  onBack: () => void
}

const CaseDetail = ({ caseData, onBack }: CaseDetailProps) => {
  const { t } = useLanguage()
  
  useEffect(() => {
    // Показываем кнопку "Назад" в Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      
      tg.BackButton.show()
      
      tg.BackButton.onClick(onBack)
      
      return () => {
        tg.BackButton.offClick(onBack)
        tg.BackButton.hide()
      }
    }
  }, [onBack])

  return (
    <div className="case-detail page">
      <div className="case-detail__container">
        <div className="case-detail__content">
          <div className="case-detail__image">
            <img src={caseData.image} alt={caseData.title} />
          </div>
          
          <div className="case-detail__info">
            <h1>{caseData.title}</h1>
            <p className="case-detail__description">{caseData.description}</p>
            
            <div className="case-detail__stats">
              <div className="stat-item">
                <span className="stat-label">{t.cases.industry}</span>
                <span className="stat-value">{caseData.details.industry}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t.cases.users}</span>
                <span className="stat-value">{caseData.details.users}</span>
              </div>
            </div>
            
            <div className="case-detail__features">
              <h3>{t.cases.features}</h3>
              <ul>
                {caseData.details.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="case-detail__result">
              <h3>{t.cases.result}</h3>
              <p>{caseData.details.result}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaseDetail

