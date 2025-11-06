import type { HttpContext } from '@adonisjs/core/http'
import PaymentMethod from '#models/payment_method'
import TBankService from '#services/tbank_service'
import crypto from 'crypto'
import env from '#start/env'

export default class PaymentMethodsController {
  private tbankService: TBankService

  constructor() {
    this.tbankService = new TBankService()
  }

  /**
   * Получить список платёжных методов клиента
   */
  async index({ auth, response }: HttpContext) {
    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      const methods = await PaymentMethod.query()
        .where('customerEmail', userEmail)
        .where('status', 'active')
        .orderBy('createdAt', 'desc')

      return response.json({
        methods: methods.map((m) => ({
          id: m.id,
          type: 'card',
          panMask: m.panMask,
          expDate: m.expDate,
          isDefault: m.isDefault,
          rebillId: m.rebillId,
        })),
      })
    } catch (error) {
      console.error('Get payment methods error:', error)
      return response.status(500).json({ error: 'Failed to fetch payment methods' })
    }
  }

  /**
   * Добавить новый платёжный метод (карту)
   */
  async store({ auth, request, response }: HttpContext) {
    const { returnUrl } = request.only(['returnUrl'])

    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      // Создаём платёж с минимальной суммой для привязки карты
      const orderId = `CARD_BIND_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

      const result = await this.tbankService.initPayment({
        amount: 1, // 1 рубль для привязки
        orderId,
        description: 'Привязка банковской карты',
        customerEmail: userEmail,
        recurrent: true,
        returnUrl: returnUrl || `${env.get('APP_BASE_URL')}/client/payment-methods`,
      })

      if (result.Success && result.PaymentURL) {
        return response.json({
          paymentUrl: result.PaymentURL,
          paymentId: result.PaymentId,
        })
      } else {
        return response.status(400).json({
          error: result.Message || 'Failed to create payment for card binding',
        })
      }
    } catch (error: any) {
      console.error('Add payment method error:', error)
      return response.status(500).json({ error: error.message || 'Failed to add payment method' })
    }
  }

  /**
   * Удалить платёжный метод
   */
  async destroy({ params, auth, response }: HttpContext) {
    const { id } = params

    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      const method = await PaymentMethod.query()
        .where('id', id)
        .where('customerEmail', userEmail)
        .first()

      if (!method) {
        return response.status(404).json({ error: 'Payment method not found' })
      }

      method.status = 'revoked'
      await method.save()

      return response.json({ success: true })
    } catch (error) {
      console.error('Delete payment method error:', error)
      return response.status(500).json({ error: 'Failed to delete payment method' })
    }
  }
}
