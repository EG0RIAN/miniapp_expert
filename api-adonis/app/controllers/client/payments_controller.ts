import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class PaymentsController {
  /**
   * Получить историю платежей клиента
   */
  async index({ auth, request, response }: HttpContext) {
    const { page = 1, limit = 20, status } = request.qs()

    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      let query = db
        .from('payments')
        .where('customer_email', userEmail)
        .orderBy('created_at', 'desc')

      if (status) {
        query = query.where('status', status)
      }

      const payments = await query
        .paginate(page, limit)

      return response.json({
        payments: payments.all().map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency || 'RUB',
          status: p.status,
          method: p.method || 'card',
          description: p.description,
          createdAt: p.created_at,
          receiptUrl: p.receipt_url,
        })),
        total: payments.total,
        page: payments.currentPage,
        lastPage: payments.lastPage,
      })
    } catch (error) {
      console.error('Get payments error:', error)
      return response.status(500).json({ error: 'Failed to fetch payments' })
    }
  }

  /**
   * Получить квитанцию/чек
   */
  async receipt({ params, auth, response }: HttpContext) {
    const { id } = params

    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      const payment = await db
        .from('payments')
        .where('id', id)
        .where('customer_email', userEmail)
        .first()

      if (!payment) {
        return response.status(404).json({ error: 'Payment not found' })
      }

      if (payment.receipt_url) {
        return response.json({ url: payment.receipt_url })
      }

      // TODO: Генерация PDF чека
      return response.status(404).json({ error: 'Receipt not available' })
    } catch (error) {
      console.error('Get receipt error:', error)
      return response.status(500).json({ error: 'Failed to fetch receipt' })
    }
  }
}
