import { useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import './Cases.css'

export interface CaseData {
  id: number
  title: string
  description: string
  image: string
  details: {
    industry: string
    users: string
    features: string[]
    result: string
  }
}

interface CasesProps {
  onNext: () => void
  onBack?: () => void
  onCaseClick: (caseId: number) => void
}

export const casesData: CaseData[] = [
  {
    id: 1,
    title: "MoscaEx",
    description: "Мгновенный обмен криптовалюты без комиссии",
    image: "/cases/mosca/1.png",
    details: {
      industry: "Криптовалюты и Финансы",
      users: "15K+ операций в месяц",
      features: ["Обмен криптовалют", "Без комиссии", "Мгновенные переводы", "Безопасные транзакции"],
      result: "Более 15 000 обменных операций, средний чек $500, конверсия в сделку 78%"
    }
  },
  {
    id: 2,
    title: "Alfin",
    description: "Международные платежи и обмен валют",
    image: "/cases/alfin/1.png",
    details: {
      industry: "Финансовые услуги",
      users: "30+ стран присутствия",
      features: ["SWIFT переводы", "Обмен валют", "Оплата ChatGPT", "Крипто-операции"],
      result: "Работа в 30+ странах, 24/7 доступность, средний чек $1200, LTV клиента $5500"
    }
  },
  {
    id: 3,
    title: "Kukushka",
    description: "Таск-трекер в Telegram с видеовстречами",
    image: "/cases/kukushka/1.png",
    details: {
      industry: "Продуктивность и Управление",
      users: "5K+ активных команд",
      features: ["Управление задачами", "Zoom/Meet интеграция", "Командная работа", "Оплата Stars и Тинькофф"],
      result: "5000+ активных команд, +65% продуктивности, средний чек 990₽/мес, удержание 89%"
    }
  },
  {
    id: 4,
    title: "Улыбка Радуги",
    description: "Магазин косметики с геймификацией",
    image: "/cases/ulybka/1.png",
    details: {
      industry: "Ритейл и E-commerce",
      users: "12K+ активных покупателей",
      features: ["Программа лояльности", "Геймификация покупок", "API интеграция", "Персональные предложения"],
      result: "Повторные покупки +85%, средний чек +42%, вовлеченность 91%, LTV клиента увеличен на 127%"
    }
  }
]

const Cases = ({ onNext, onBack, onCaseClick }: CasesProps) => {
  const { t } = useLanguage()
  
  useEffect(() => {
    // Показываем кнопку "Назад" в Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      
      tg.BackButton.show()
      
      tg.BackButton.onClick(() => {
        if (onBack) {
          onBack()
        }
      })
      
      return () => {
        tg.BackButton.offClick(() => {})
        tg.BackButton.hide()
      }
    }
  }, [onBack])

  const handleNext = () => {
    onNext()
  }

  return (
    <div className="cases page">
      <div className="cases__container">
        <div className="cases__title">
          <h1>
            <p style={{ color: 'var(--tg-theme-button-color)' }}>{t.cases.title1}</p>
            <p>{t.cases.title2}</p>
          </h1>
          <p>
            {t.cases.subtitle}
            <span style={{ fontWeight: 600, fontSize: '18px', lineHeight: '24px' }}>
              {' '}{t.cases.subtitleBold}
            </span>
          </p>
        </div>

        <div className="cases__grid">
          {casesData.map((caseItem) => (
            <div 
              key={caseItem.id}
              className="case-card"
              onClick={() => onCaseClick(caseItem.id)}
            >
              <div className="case-card__image">
                <img src={caseItem.image} alt={caseItem.title} />
              </div>
              <div className="case-card__content">
                <h3>{caseItem.title}</h3>
                <p>{caseItem.description}</p>
                <div className="case-card__arrow">→</div>
              </div>
            </div>
          ))}
        </div>

        <button className="next-button" onClick={handleNext}>
          {t.cases.nextButton}
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

export default Cases
