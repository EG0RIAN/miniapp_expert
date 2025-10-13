#!/usr/bin/env python3
"""
Telegram Bot Proxy для Rello Mini App
Принимает данные из Mini App и отправляет на API
"""

import os
import json
import logging
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Конфигурация из переменных окружения
BOT_TOKEN = os.getenv('BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
API_URL = os.getenv('API_URL', 'https://arkhiptsev.com/api/leads/create/')
API_TOKEN = os.getenv('API_TOKEN', 'O2EZjvewEsiLytylbDT7ioDiJLheh2cZJDWuqQvtYmtW1BZetj7ylKimJBQUTTqM')


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    await update.message.reply_text(
        '👋 Привет! Я бот для приема заявок из Rello Mini App.\n\n'
        'Откройте Mini App через кнопку меню ниже.'
    )


async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик данных из Web App"""
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("🔔 ПОЛУЧЕНО СОБЫТИЕ WEB_APP_DATA!")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    try:
        # Получаем данные из Web App
        web_app_data = update.effective_message.web_app_data.data
        logger.info(f"📦 Получены данные из Web App: {web_app_data}")
        
        # Получаем данные пользователя Telegram
        user = update.effective_user
        logger.info(f"Данные пользователя Telegram: ID={user.id}, username={user.username}, "
                   f"first_name={user.first_name}, last_name={user.last_name}")
        
        # Парсим JSON из формы
        form_data = json.loads(web_app_data)
        logger.info(f"Данные из формы: {form_data}")
        
        # Объединяем данные: берем first_name и last_name из Telegram
        lead_data = {
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'phone': form_data.get('phone', ''),
            'telegram': form_data.get('telegram', '') or (f"@{user.username}" if user.username else ''),
            'client_language': form_data.get('client_language', 'ru'),
            'description': form_data.get('description', ''),
            'comment': form_data.get('comment', '')
        }
        
        logger.info(f"Итоговые данные для API: {lead_data}")
        
        # Отправляем на API
        headers = {
            'Authorization': f'Bearer {API_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        logger.info(f"Отправка на API: {API_URL}")
        response = requests.post(API_URL, json=lead_data, headers=headers)
        
        logger.info(f"Ответ API: {response.status_code} - {response.text}")
        
        if response.status_code == 201:
            response_data = response.json()
            lead_id = response_data.get('lead_id')
            
            await update.effective_message.reply_text(
                f'✅ Заявка #{lead_id} успешно создана!\n\n'
                f'Мы свяжемся с вами в течение часа.'
            )
        else:
            logger.error(f"Ошибка API: {response.text}")
            await update.effective_message.reply_text(
                '❌ Произошла ошибка при создании заявки.\n'
                'Пожалуйста, попробуйте позже.'
            )
            
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка парсинга JSON: {e}")
        await update.effective_message.reply_text(
            '❌ Ошибка обработки данных.'
        )
    except Exception as e:
        logger.error(f"Ошибка обработки данных: {e}", exc_info=True)
        await update.effective_message.reply_text(
            '❌ Произошла ошибка. Попробуйте еще раз.'
        )


def main():
    """Запуск бота"""
    logger.info("Запуск бота...")
    
    # Проверяем наличие токена
    if BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        logger.error("Не установлен BOT_TOKEN! Установите переменную окружения BOT_TOKEN")
        return
    
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрируем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    
    # Запускаем бота
    logger.info("Бот запущен и готов к работе!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()

