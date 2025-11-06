import axios from 'axios'
import crypto from 'crypto'
import env from '#start/env'

interface TBankInitPaymentParams {
  amount: number
  orderId: string
  description: string
  customerEmail: string
  recurrent?: boolean
  returnUrl?: string
}

interface TBankChargeParams {
  rebillId: string
  amount: number
  orderId: string
  description: string
  customerEmail: string
}

interface TBankPaymentResponse {
  Success: boolean
  ErrorCode?: string
  Message?: string
  TerminalKey: string
  Status?: string
  PaymentId?: string
  OrderId?: string
  Amount?: number
  PaymentURL?: string
  RebillId?: string
}

export default class TBankService {
  private terminalKey: string
  private secretKey: string
  private apiUrl: string

  constructor() {
    this.terminalKey = env.get('TBANK_TERMINAL_KEY') || ''
    this.secretKey = env.get('TBANK_PASSWORD') || ''
    this.apiUrl = env.get('TBANK_API_URL') || 'https://securepay.tinkoff.ru/v2'
  }

  /**
   * Генерация токена для подписи запроса
   */
  private generateToken(params: Record<string, any>): string {
    const values: Record<string, any> = {
      ...params,
      Password: this.secretKey,
    }

    // Удаляем поля, которые не участвуют в подписи
    delete values.Token
    delete values.Receipt
    delete values.DATA

    // Сортируем ключи и конкатенируем значения
    const sortedKeys = Object.keys(values).sort()
    const concatenated = sortedKeys.map((key) => values[key]).join('')

    return crypto.createHash('sha256').update(concatenated).digest('hex')
  }

  /**
   * Инициализация платежа (CIT) с возможностью сохранения карты
   */
  async initPayment(params: TBankInitPaymentParams): Promise<TBankPaymentResponse> {
    const requestData = {
      TerminalKey: this.terminalKey,
      Amount: Math.round(params.amount * 100), // копейки
      OrderId: params.orderId,
      Description: params.description,
      CustomerKey: params.customerEmail,
      Recurrent: params.recurrent ? 'Y' : undefined,
      SuccessURL: params.returnUrl,
      FailURL: params.returnUrl,
      NotificationURL: `${env.get('APP_BASE_URL')}/api/tbank/webhook`,
    }

    const token = this.generateToken(requestData)

    try {
      const response = await axios.post(`${this.apiUrl}/Init`, {
        ...requestData,
        Token: token,
      })

      return response.data
    } catch (error: any) {
      console.error('T-Bank Init Payment Error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.Message || 'Payment initialization failed')
    }
  }

  /**
   * Списание по сохранённой карте (MIT)
   */
  async chargeMIT(params: TBankChargeParams): Promise<TBankPaymentResponse> {
    const requestData = {
      TerminalKey: this.terminalKey,
      Amount: Math.round(params.amount * 100), // копейки
      OrderId: params.orderId,
      Description: params.description,
      RebillId: params.rebillId,
      CustomerKey: params.customerEmail,
      NotificationURL: `${env.get('APP_BASE_URL')}/api/tbank/webhook`,
    }

    const token = this.generateToken(requestData)

    try {
      const response = await axios.post(`${this.apiUrl}/Init`, {
        ...requestData,
        Token: token,
      })

      return response.data
    } catch (error: any) {
      console.error('T-Bank MIT Charge Error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.Message || 'MIT charge failed')
    }
  }

  /**
   * Проверка статуса платежа
   */
  async getPaymentStatus(paymentId: string): Promise<TBankPaymentResponse> {
    const requestData = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    }

    const token = this.generateToken(requestData)

    try {
      const response = await axios.post(`${this.apiUrl}/GetState`, {
        ...requestData,
        Token: token,
      })

      return response.data
    } catch (error: any) {
      console.error('T-Bank Get Status Error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.Message || 'Failed to get payment status')
    }
  }

  /**
   * Проверка подписи вебхука
   */
  verifyWebhookSignature(webhookData: Record<string, any>): boolean {
    const receivedToken = webhookData.Token
    const calculatedToken = this.generateToken(webhookData)

    return receivedToken === calculatedToken
  }

  /**
   * Генерация платёжного требования для РКО (CSV)
   */
  generateRKOPaymentOrder(params: {
    mandateNumber: string
    customerName: string
    amount: number
    purpose: string
    date: Date
  }): string {
    // Упрощённый формат CSV для платёжного требования
    const lines = [
      'Номер мандата,Плательщик,Сумма,Назначение платежа,Дата',
      `${params.mandateNumber},${params.customerName},${params.amount},"${params.purpose}",${params.date.toISOString().split('T')[0]}`,
    ]

    return lines.join('\n')
  }
}

