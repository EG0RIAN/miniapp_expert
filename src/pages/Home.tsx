import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import './Home.css'
import { useLanguage } from '../contexts/LanguageContext'
import Cases, { casesData } from './Cases'
import CaseDetail from './CaseDetail'
import Advantages from './Advantages'
import ContactForm from './ContactForm'

const Home = () => {
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [currentScreen, setCurrentScreen] = useState('home')
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNextScreen = () => {
    setCurrentScreen('cases')
  }


  if (currentScreen === 'case-detail' && selectedCaseId) {
    const caseData = casesData.find(c => c.id === selectedCaseId)
    if (caseData) {
      return (
        <CaseDetail 
          caseData={caseData}
          onBack={() => {
            setSelectedCaseId(null)
            setCurrentScreen('cases')
          }}
        />
      )
    }
  }

  if (currentScreen === 'cases') {
    return (
      <Cases 
        onNext={() => setCurrentScreen('advantages')} 
        onBack={() => setCurrentScreen('home')}
        onCaseClick={(caseId) => {
          setSelectedCaseId(caseId)
          setCurrentScreen('case-detail')
        }}
      />
    )
  }

  if (currentScreen === 'advantages') {
    return (
      <Advantages 
        onNext={() => setCurrentScreen('contact')} 
        onBack={() => setCurrentScreen('cases')}
      />
    )
  }

  if (currentScreen === 'contact') {
    return (
      <ContactForm 
        onBack={() => setCurrentScreen('advantages')}
      />
    )
  }

  return (
    <div className="home page">
      <div className="home__left">
        <div className="home__title">
          <h1>
            <p style={{ color: 'var(--tg-theme-button-color)' }}>{t.home.title1}</p>
            <p>{t.home.title2}</p>
          </h1>
          <p>
            {t.home.subtitle}{' '}
            <span style={{ fontWeight: 600, fontSize: '18px', lineHeight: '24px' }}>
              {t.home.subtitleBold}
            </span>
          </p>
        </div>

        <div className="home__companies-wrapper">
          <p>{t.home.trustUs}</p>
          <div className="home__companies">
            <div className="logos-company logos-company_with-image">
              <img src="/cases/mosca/logo.svg" alt="MoscaEx" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'brightness(0) saturate(100%)' }} />
            </div>
            <div className="logos-company logos-company_with-image">
              <img src="/cases/alfin/logo.svg" alt="Alfin" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'brightness(0) saturate(100%)' }} />
            </div>
            <div className="logos-company logos-company_with-image">
              <img src="/cases/kukushka/logo.svg" alt="Kukushka" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
            <div className="logos-company logos-company_with-image">
              <img src="/cases/ulybka/logo.svg" alt="Улыбка Радуги" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="home__right">
        <div className="mockup-container">
          {mounted && (
            <Swiper
              modules={[Autoplay, EffectFade]}
              effect="fade"
              fadeEffect={{
                crossFade: true
              }}
              spaceBetween={0}
              slidesPerView={1}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              loop={true}
              className="mySwiper"
              onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
            >
              <SwiperSlide>
                <div className="home__companies-swiper-slider">
                  <img 
                    src="/cases/mosca/1.png" 
                    alt="MoscaEx - Crypto Exchange" 
                    className="mockup-image fade-in"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="home__companies-swiper-slider">
                  <img 
                    src="/cases/alfin/1.png" 
                    alt="Alfin - International Payments" 
                    className="mockup-image fade-in"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="home__companies-swiper-slider">
                  <img 
                    src="/cases/kukushka/1.png" 
                    alt="Kukushka - Task Tracker" 
                    className="mockup-image fade-in"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="home__companies-swiper-slider">
                  <img 
                    src="/cases/ulybka/1.png" 
                    alt="Улыбка Радуги - Cosmetics Store" 
                    className="mockup-image fade-in"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="home__companies-swiper-slider">
                  <img 
                    src="/cases/mosca/2.png" 
                    alt="MoscaEx - App Screen 2" 
                    className="mockup-image fade-in"
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="home__companies-swiper-slider">
                  <img 
                    src="/cases/alfin/2.png" 
                    alt="Alfin - App Screen 2" 
                    className="mockup-image fade-in"
                  />
                </div>
              </SwiperSlide>
            </Swiper>
          )}
        </div>
      </div>

      <button className="next-button" onClick={handleNextScreen}>
        {t.home.nextButton}
        <span>→</span>
      </button>
    </div>
  )
}

export default Home

