import requests
import hashlib
from django.conf import settings
from typing import Dict, Optional


class TBankService:
    """Сервис для работы с T-Bank API"""
    
    def __init__(self):
        self.terminal_key = settings.TBANK_TERMINAL_KEY
        self.password = settings.TBANK_PASSWORD
        self.api_url = settings.TBANK_API_URL
    
    def _generate_token(self, params: Dict) -> str:
        """Генерация токена для T-Bank API"""
        import json
        
        # Создаем копию параметров без Token
        token_params = {k: v for k, v in params.items() if k != 'Token'}
        token_params['Password'] = self.password
        
        # Функция для преобразования значений в строку
        def value_to_string(value):
            if isinstance(value, dict):
                # Для словарей сортируем ключи и рекурсивно обрабатываем значения
                sorted_items = sorted(value.items())
                return ''.join(f'{k}{value_to_string(v)}' for k, v in sorted_items)
            elif isinstance(value, list):
                # Для списков обрабатываем каждый элемент
                return ''.join(value_to_string(item) for item in value)
            else:
                # Для примитивных типов просто преобразуем в строку
                return str(value)
        
        # Сортируем ключи и формируем строку для токена
        sorted_keys = sorted(token_params.keys())
        token_string = ''.join(f'{k}{value_to_string(token_params[k])}' for k in sorted_keys)
        
        return hashlib.sha256(token_string.encode()).hexdigest()
    
    def init_payment(
        self,
        amount: float,
        order_id: str,
        description: str,
        email: str,
        phone: str,
        name: str,
        save_method: bool = False
    ) -> Dict:
        """Создание платежа"""
        payment_data = {
            'TerminalKey': self.terminal_key,
            'Amount': int(amount * 100),  # Конвертируем в копейки
            'OrderId': order_id,
            'Description': description,
            'Receipt': {
                'Email': email,
                'Phone': phone,
                'Taxation': 'usn_income',
                'Items': [
                    {
                        'Name': description,
                        'Price': int(amount * 100),
                        'Quantity': 1,
                        'Amount': int(amount * 100),
                        'Tax': 'none',
                    }
                ],
            },
            'DATA': {
                'Name': name or 'Клиент',
                'Email': email,
                'Phone': phone,
            },
            'SuccessURL': f"{settings.FRONTEND_BASE_URL}/payment-success.html?orderId={order_id}",
            'FailURL': f"{settings.FRONTEND_BASE_URL}/payment-failed.html?orderId={order_id}&error=declined",
            'NotificationURL': f"{settings.API_BASE_URL}/api/payment/webhook",
        }
        
        if save_method:
            payment_data['Recurrent'] = 'Y'
        
        payment_data['Token'] = self._generate_token(payment_data)
        
        response = requests.post(f"{self.api_url}/Init", json=payment_data)
        return response.json()
    
    def get_payment_status(self, payment_id: str) -> Dict:
        """Получение статуса платежа"""
        payload = {
            'TerminalKey': self.terminal_key,
            'PaymentId': payment_id,
        }
        payload['Token'] = self._generate_token(payload)
        
        response = requests.post(f"{self.api_url}/GetState", json=payload)
        return response.json()
    
    def charge_mit(self, rebill_id: str, amount: float, order_id: str, idempotency_key: str) -> Dict:
        """Списание по MIT (сохраненной карте)"""
        payment_data = {
            'TerminalKey': self.terminal_key,
            'Amount': int(amount * 100),
            'OrderId': order_id,
            'RebillId': rebill_id,
        }
        payment_data['Token'] = self._generate_token(payment_data)
        
        response = requests.post(f"{self.api_url}/Charge", json=payment_data)
        return response.json()

