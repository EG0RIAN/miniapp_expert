import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import TBankService from '#services/tbank_service'
import PaymentMethod from '#models/payment_method'
import crypto from 'crypto'

export default class ProductsController {
  private tbankService: TBankService

  constructor() {
    this.tbankService = new TBankService()
  }

  /**
   * Получить список продуктов клиента
   */
  async index({ auth, response }: HttpContext) {
    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      const products = await db
        .from('user_products')
        .where('user_email', userEmail)
        .orderBy('created_at', 'desc')
        .select('*')

      return response.json({
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          startDate: p.start_date,
          endDate: p.end_date,
          renewalPrice: p.renewal_price,
          canRenew: p.status === 'active' || p.status === 'expired',
        })),
      })
    } catch (error) {
      console.error('Get products error:', error)
      return response.status(500).json({ error: 'Failed to fetch products' })
    }
  }

  /**
   * Продлить продукт
   */
  async renew({ params, request, auth, response }: HttpContext) {
    const { id } = params
    const { paymentMethodId } = request.only(['paymentMethodId'])

    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      // Получаем продукт
      const product = await db
        .from('user_products')
        .where('id', id)
        .where('user_email', userEmail)
        .first()

      if (!product) {
        return response.status(404).json({ error: 'Product not found' })
      }

      if (!product.renewal_price) {
        return response.status(400).json({ error: 'Product cannot be renewed' })
      }

      // Если указан paymentMethodId - используем MIT
      if (paymentMethodId) {
        const paymentMethod = await PaymentMethod.query()
          .where('id', paymentMethodId)
          .where('customerEmail', userEmail)
          .where('status', 'active')
          .first()

        if (!paymentMethod) {
          return response.status(404).json({ error: 'Payment method not found' })
        }

        const orderId = `RENEW_${product.id}_${Date.now()}`

        const result = await this.tbankService.chargeMIT({
          rebillId: paymentMethod.rebillId,
          amount: product.renewal_price,
          orderId,
          description: `Продление продукта: ${product.name}`,
          customerEmail: userEmail,
        })

        if (result.Success) {
          // Создаём запись о платеже
          await db.table('payments').insert({
            id: crypto.randomUUID(),
            customer_email: userEmail,
            amount: product.renewal_price,
            currency: 'RUB',
            status: 'success',
            provider_ref: result.PaymentId,
            description: `Продление: ${product.name}`,
            created_at: new Date(),
          })

          return response.json({
            status: 'success',
            message: 'Product renewed successfully',
          })
        } else {
          return response.status(400).json({
            status: 'failed',
            error: result.Message || 'Payment failed',
          })
        }
      } else {
        // Создаём обычный платёж
        const orderId = `RENEW_${product.id}_${Date.now()}`

        const result = await this.tbankService.initPayment({
          amount: product.renewal_price,
          orderId,
          description: `Продление продукта: ${product.name}`,
          customerEmail: userEmail,
          returnUrl: `${process.env.APP_BASE_URL}/client/products/${id}`,
        })

        if (result.Success && result.PaymentURL) {
          return response.json({
            status: 'pending',
            paymentUrl: result.PaymentURL,
          })
        } else {
          return response.status(400).json({
            error: result.Message || 'Failed to create payment',
          })
        }
      }
    } catch (error: any) {
      console.error('Renew product error:', error)
      return response.status(500).json({ error: error.message || 'Failed to renew product' })
    }
  }
}
