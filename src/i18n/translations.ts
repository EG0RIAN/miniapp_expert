export const translations = {
  ru: {
    // Главная страница
    home: {
      title1: 'Создаем приложения',
      title2: 'для бизнеса',
      subtitle: 'Как эти компании увеличили продажи на 45% с помощью',
      subtitleBold: 'Telegram Mini App',
      trustUs: 'Нам доверяют',
      yourApp: 'Ваше приложение',
      nextButton: 'Далее'
    },
    // Кейсы
    cases: {
      title1: 'Наши',
      title2: 'кейсы',
      subtitle: 'Реальные проекты, которые мы создали',
      subtitleBold: 'для крупных компаний',
      industry: 'Отрасль:',
      users: 'Пользователи:',
      features: 'Основные функции:',
      result: 'Результат:',
      nextButton: 'Далее'
    },
    // Преимущества
    advantages: {
      title1: 'Преимущества',
      title2: 'нашего решения',
      subtitle: 'Почему выбирают именно нас для создания',
      subtitleBold: 'мини-приложений',
      advantage1: {
        title: 'Быстрая разработка',
        description: 'Запустим ваше приложение за 2-3 недели'
      },
      advantage2: {
        title: 'Доступная цена',
        description: 'В 3-5 раз дешевле, чем обычная разработка'
      },
      advantage3: {
        title: 'Готовая аудитория',
        description: 'Миллионы пользователей Telegram уже ждут'
      },
      advantage4: {
        title: 'Техническая поддержка',
        description: 'Помогаем с интеграцией и развитием после запуска'
      },
      nextButton: 'Далее'
    },
    // Форма
    contact: {
      title1: 'Обсудим',
      title2: 'ваш проект?',
      subtitle: 'Оставьте свои контакты и мы свяжемся с вами',
      subtitleBold: 'в течение часа',
      telegramLabel: 'Никнейм в Telegram',
      telegramPlaceholder: '@username (необязательно)',
      phoneLabel: 'Номер телефона',
      phonePlaceholder: '+7 (999) 123-45-67',
      submitButton: 'Отправить',
      errorPhone: 'Введите корректный номер телефона',
      errorPhoneRequired: 'Номер телефона обязателен'
    },
    // Успех
    success: {
      title1: 'Мы скоро',
      title2: 'свяжемся с вами!',
      message: 'Спасибо за интерес к нашему сервису.',
      messageContinue: 'Наш менеджер свяжется с вами в течение часа для обсуждения деталей проекта.',
      detail1Title: 'Время ответа:',
      detail1Value: 'В течение часа',
      detail2Title: 'Способ связи:',
      detail2Value: 'Telegram или телефон',
      detail3Title: 'Что обсудим:',
      detail3Value: 'Детали вашего проекта'
    }
  },
  en: {
    // Home page
    home: {
      title1: 'We create applications',
      title2: 'for business',
      subtitle: 'How these companies increased sales by 45% with',
      subtitleBold: 'Telegram Mini App',
      trustUs: 'They trust us',
      yourApp: 'Your app',
      nextButton: 'Next'
    },
    // Cases
    cases: {
      title1: 'Our',
      title2: 'cases',
      subtitle: 'Real projects we created',
      subtitleBold: 'for major companies',
      industry: 'Industry:',
      users: 'Users:',
      features: 'Key features:',
      result: 'Result:',
      nextButton: 'Next'
    },
    // Advantages
    advantages: {
      title1: 'Advantages',
      title2: 'of our solution',
      subtitle: 'Why choose us for creating',
      subtitleBold: 'mini-apps',
      advantage1: {
        title: 'Fast development',
        description: 'Launch your app in 2-3 weeks'
      },
      advantage2: {
        title: 'Affordable price',
        description: '3-5 times cheaper than traditional development'
      },
      advantage3: {
        title: 'Ready audience',
        description: 'Millions of Telegram users are waiting'
      },
      advantage4: {
        title: 'Technical support',
        description: 'We help with integration and growth after launch'
      },
      nextButton: 'Next'
    },
    // Contact
    contact: {
      title1: 'Discuss',
      title2: 'your project?',
      subtitle: 'Leave your contacts and we will contact you',
      subtitleBold: 'within an hour',
      telegramLabel: 'Telegram username',
      telegramPlaceholder: '@username (optional)',
      phoneLabel: 'Phone number',
      phonePlaceholder: '+1 (999) 123-45-67',
      submitButton: 'Submit',
      errorPhone: 'Enter a valid phone number',
      errorPhoneRequired: 'Phone number is required'
    },
    // Success
    success: {
      title1: 'We will contact',
      title2: 'you soon!',
      message: 'Thank you for your interest in our service.',
      messageContinue: 'Our manager will contact you within an hour to discuss project details.',
      detail1Title: 'Response time:',
      detail1Value: 'Within an hour',
      detail2Title: 'Contact method:',
      detail2Value: 'Telegram or phone',
      detail3Title: 'What we discuss:',
      detail3Value: 'Your project details'
    }
  }
}

export type Language = 'ru' | 'en'

export const getTranslations = (lang?: string): typeof translations.ru => {
  // Определяем язык
  let language: Language = 'ru'
  
  if (lang) {
    const langCode = lang.toLowerCase()
    if (langCode.startsWith('en')) {
      language = 'en'
    } else if (langCode.startsWith('ru')) {
      language = 'ru'
    }
  }
  
  return translations[language]
}

