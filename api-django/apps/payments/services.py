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
        """Генерация токена для T-Bank API
        
        Алгоритм генерации токена (по документации T-Bank):
        1. Берем все параметры кроме Token и Receipt
        2. Добавляем Password
        3. Сортируем ключи по алфавиту
        4. Для каждого ключа преобразуем значение в строку
        5. Для вложенных структур (dict, list) используется JSON сериализация БЕЗ пробелов
        6. Конкатенируем все значения в одну строку (БЕЗ ключей)
        7. Хешируем через SHA256
        
        Важно: Receipt НЕ включается в генерацию токена!
        """
        import json
        
        # Создаем копию параметров без Token и Receipt
        # ВАЖНО: Receipt НЕ участвует в генерации токена!
        token_params = {k: v for k, v in params.items() if k not in ['Token', 'Receipt', 'DATA']}
        token_params['Password'] = self.password
        
        # Сортируем ключи и формируем строку для токена
        # ВАЖНО: Только значения, БЕЗ ключей! (по документации T-Bank)
        sorted_keys = sorted(token_params.keys())
        token_parts = []
        
        for key in sorted_keys:
            value = token_params[key]
            # Для dict и list используем JSON сериализацию БЕЗ пробелов
            if isinstance(value, (dict, list)):
                # ВАЖНО: T-Bank требует сортировку ключей внутри всех вложенных структур
                # Используем компактный JSON с сортировкой ключей
                token_parts.append(json.dumps(value, ensure_ascii=True, separators=(',', ':'), sort_keys=True))
            else:
                token_parts.append(str(value))
        
        token_string = ''.join(token_parts)
        
        # Логируем для отладки
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"Token generation - sorted keys: {sorted_keys}")
        logger.debug(f"Token string (first 300 chars): {token_string[:300]}")
        token = hashlib.sha256(token_string.encode('utf-8')).hexdigest()
        logger.debug(f"Generated token: {token}")
        
        return token
    
    def init_payment(
        self,
        amount: float,
        order_id: str,
        description: str,
        email: str,
        phone: str,
        name: str,
        save_method: bool = False,
        is_subscription: bool = False,
        product_name: str = None,
        customer_key: str = None,
        extra_data: dict = None,
    ) -> Dict:
        """Создание платежа
        
        Args:
            amount: Сумма платежа
            order_id: ID заказа
            description: Описание платежа
            email: Email клиента
            phone: Телефон клиента
            name: Имя клиента
            save_method: Сохранить карту для рекуррентных платежей
            is_subscription: Является ли платеж подпиской
            product_name: Название продукта для чека
            customer_key: CustomerKey для рекуррентных платежей (обязателен при Recurrent=Y)
        """
        import uuid
        
        # Базовая структура платежа
        payment_data = {
            'TerminalKey': self.terminal_key,
            'Amount': int(amount * 100),  # Конвертируем в копейки
            'OrderId': order_id,
            'Description': description[:250],  # Ограничение T-Bank API
        }
        
        # URL для редиректов после оплаты
        frontend_base = settings.FRONTEND_BASE_URL.rstrip('/')
        payment_data['SuccessURL'] = f"{frontend_base}/payment-success.html?orderId={order_id}"
        payment_data['FailURL'] = f"{frontend_base}/payment-failed.html?orderId={order_id}"
        payment_data['NotificationURL'] = settings.PAYMENT_NOTIFICATION_URL
        
        # Для подписок включаем рекуррентные платежи
        if save_method or is_subscription:
            payment_data['Recurrent'] = 'Y'
            # PayType=T для двухстадийного платежа (обязательно для Recurrent=Y)
            payment_data['PayType'] = 'T'
            # CustomerKey обязателен для Recurrent=Y
            if customer_key:
                payment_data['CustomerKey'] = customer_key
            else:
                # Генерируем CustomerKey если не передан
                payment_data['CustomerKey'] = str(uuid.uuid4())
        
        # Добавляем объект Receipt для формирования чека
        # Согласно документации T-Bank, Receipt должен содержать:
        # - Email или Phone клиента
        # - Items - список товаров/услуг
        # - Taxation - система налогообложения
        receipt = {
            'Email': email,
            'Phone': phone,
            'Taxation': 'usn_income',  # Упрощенная система налогообложения (доходы)
            'Items': [
                {
                    'Name': product_name or description[:128],  # Название товара/услуги (макс 128 символов)
                    'Price': int(amount * 100),  # Цена в копейках
                    'Quantity': 1,  # Количество
                    'Amount': int(amount * 100),  # Сумма в копейках
                    'Tax': 'none',  # Налог (none - без НДС, vat10, vat20 и т.д.)
                }
            ]
        }
        payment_data['Receipt'] = receipt
        
        if extra_data:
            payment_data['DATA'] = extra_data
        
        # Генерируем токен ПОСЛЕ формирования всех данных
        payment_data['Token'] = self._generate_token(payment_data)
        
        # Логируем запрос для отладки (без чувствительных данных)
        import logging
        logger = logging.getLogger(__name__)
        debug_data = {k: v for k, v in payment_data.items() if k not in ['Token', 'Password', 'Receipt']}
        debug_data['Receipt'] = '***' if 'Receipt' in payment_data else None
        logger.debug(f"T-Bank Init request: {debug_data}")
        
        try:
            response = requests.post(
                f"{self.api_url}/Init", 
                json=payment_data,
                timeout=30,  # Таймаут 30 секунд
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'miniapp-expert/1.0'
                }
            )
            response.raise_for_status()  # Проверяем HTTP статус
            result = response.json()
            
            # Логируем ответ для отладки
            if not result.get('Success'):
                logger.error(
                    f"T-Bank Init error: ErrorCode={result.get('ErrorCode')}, "
                    f"Message={result.get('Message')}, Response={result}"
                )
            
            return result
        except requests.exceptions.Timeout:
            logger.error("T-Bank Init timeout after 30 seconds")
            return {
                'Success': False,
                'ErrorCode': 'TIMEOUT',
                'Message': 'Превышено время ожидания ответа от T-Bank'
            }
        except requests.exceptions.ConnectionError as e:
            logger.error(f"T-Bank Init connection error: {e}")
            return {
                'Success': False,
                'ErrorCode': 'CONNECTION_ERROR',
                'Message': f'Ошибка подключения к T-Bank: {str(e)}'
            }
        except requests.exceptions.HTTPError as e:
            logger.error(f"T-Bank Init HTTP error: {e}")
            return {
                'Success': False,
                'ErrorCode': 'HTTP_ERROR',
                'Message': f'HTTP ошибка: {str(e)}'
            }
        except Exception as e:
            logger.error(f"T-Bank Init unexpected error: {e}")
            return {
                'Success': False,
                'ErrorCode': 'UNKNOWN_ERROR',
                'Message': f'Неожиданная ошибка: {str(e)}'
            }
    
    def get_payment_status(self, payment_id: str) -> Dict:
        """Получение статуса платежа"""
        payload = {
            'TerminalKey': self.terminal_key,
            'PaymentId': payment_id,
        }
        payload['Token'] = self._generate_token(payload)
        
        response = requests.post(f"{self.api_url}/GetState", json=payload)
        return response.json()
    
    def confirm_payment(self, payment_id: str, amount: int = None) -> Dict:
        """Подтверждение авторизованного платежа (двухстадийная оплата)
        
        Args:
            payment_id: ID платежа в T-Bank
            amount: Сумма подтверждения в копейках (если None, подтверждается полная сумма)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        payload = {
            'TerminalKey': self.terminal_key,
            'PaymentId': str(payment_id),
        }
        
        if amount is not None:
            payload['Amount'] = int(amount)
        
        payload['Token'] = self._generate_token(payload)
        
        logger.info(f"Confirming payment {payment_id} with amount {amount}")
        
        try:
            response = requests.post(f"{self.api_url}/Confirm", json=payload, timeout=30)
            result = response.json()
            logger.info(f"Confirm response: {result}")
            return result
        except Exception as e:
            logger.error(f"Error confirming payment: {e}")
            return {
                'Success': False,
                'ErrorCode': 'CONFIRM_ERROR',
                'Message': str(e)
            }

    def cancel_payment(self, payment_id: str, amount: int = None) -> Dict:
        import logging
        logger = logging.getLogger(__name__)
        
        payload = {
            'TerminalKey': self.terminal_key,
            'PaymentId': str(payment_id),
        }
        if amount is not None:
            payload['Amount'] = int(amount)
        
        payload['Token'] = self._generate_token(payload)
        
        try:
            response = requests.post(f"{self.api_url}/Cancel", json=payload, timeout=30)
            result = response.json()
            logger.info(f"Cancel response for payment {payment_id}: {result}")
            return result
        except Exception as e:
            logger.error(f"Error cancelling payment {payment_id}: {e}")
            return {
                'Success': False,
                'ErrorCode': 'CANCEL_ERROR',
                'Message': str(e)
            }
    
    def charge_mit(
        self,
        rebill_id: str,
        amount: float,
        order_id: str,
        description: str = None,
        email: str = None,
        phone: str = None,
        product_name: str = None,
    ) -> Dict:
        """Списание по MIT (сохраненной карте) для рекуррентных платежей
        
        Согласно документации T-Bank, для списания по RebillId используется двухшаговый процесс:
        1. Сначала Init (без RebillId, но с Receipt)
        2. Потом Charge с PaymentId (из Init) и RebillId
        
        Args:
            rebill_id: ID сохраненной карты (RebillId)
            amount: Сумма списания
            order_id: ID заказа
            description: Описание платежа
            email: Email клиента (для чека)
            phone: Телефон клиента (для чека)
            product_name: Название продукта (для чека)
        """
        # Шаг 1: Init (без RebillId, но с Receipt)
        init_payload = {
            'TerminalKey': self.terminal_key,
            'Amount': int(amount * 100),
            'OrderId': order_id,
        }
        
        # Добавляем описание, если указано
        if description:
            init_payload['Description'] = description[:250]
        
        # Добавляем Receipt для формирования чека
        if email or phone:
            receipt = {
                'Taxation': 'usn_income',
                'Items': [
                    {
                        'Name': (product_name or description or 'Подписка')[:128],
                        'Price': int(amount * 100),
                        'Quantity': 1,
                        'Amount': int(amount * 100),
                        'Tax': 'none',
                    }
                ]
            }
            if email:
                receipt['Email'] = email
            if phone:
                receipt['Phone'] = phone
            init_payload['Receipt'] = receipt
        
        init_payload['Token'] = self._generate_token(init_payload)
        
        # Выполняем Init
        init_response = requests.post(f"{self.api_url}/Init", json=init_payload)
        init_result = init_response.json()
        
        if not init_result.get('Success'):
            # Если Init не удался, возвращаем ошибку
            return init_result
        
        payment_id = init_result.get('PaymentId')
        if not payment_id:
            return {
                'Success': False,
                'ErrorCode': 'INIT_NO_PAYMENT_ID',
                'Message': 'Init не вернул PaymentId',
                'Details': init_result
            }
        
        # Шаг 2: Charge с PaymentId и RebillId
        charge_payload = {
            'TerminalKey': self.terminal_key,
            'PaymentId': str(payment_id),
            'RebillId': str(rebill_id),
        }
        
        charge_payload['Token'] = self._generate_token(charge_payload)
        
        # Выполняем Charge
        charge_response = requests.post(f"{self.api_url}/Charge", json=charge_payload)
        return charge_response.json()
    
    def get_receipt(self, payment_id: str) -> Dict:
        """Получение чека по ID платежа
        
        T-Bank может предоставить URL чека через GetState или через отдельный endpoint.
        Этот метод получает статус платежа и извлекает информацию о чеке.
        """
        payment_status = self.get_payment_status(payment_id)
        
        # T-Bank может вернуть URL чека в разных полях
        receipt_url = (
            payment_status.get('ReceiptURL') or 
            payment_status.get('ReceiptUrl') or 
            payment_status.get('Receipt') or
            payment_status.get('receipt_url')
        )
        
        return {
            'success': payment_status.get('Success', False),
            'receipt_url': receipt_url,
            'payment_id': payment_id,
            'status': payment_status.get('Status'),
        }

