import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import PaymentMethod from '#models/payment_method'
import Mandate from '#models/mandate'
import ManualCharge from '#models/manual_charge'
import AuditLog from '#models/audit_log'

export default class CustomersController {
  /**
   * Получить список клиентов с фильтрацией и пагинацией
   */
  async index({ request, response }: HttpContext) {
    const { search, page = 1, limit = 20 } = request.qs()

    try {
      let query = db.from('users').select('*')

      if (search) {
        query = query.where((builder) => {
          builder
            .where('email', 'ilike', `%${search}%`)
            .orWhere('name', 'ilike', `%${search}%`)
        })
      }

      const customers = await query
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.json({
        customers: customers.all(),
        total: customers.total,
        page: customers.currentPage,
        lastPage: customers.lastPage,
      })
    } catch (error) {
      console.error('Get customers error:', error)
      return response.status(500).json({ error: 'Failed to fetch customers' })
    }
  }

  /**
   * Получить детальную информацию о клиенте
   */
  async show({ params, response }: HttpContext) {
    const { id } = params

    try {
      // Получаем данные клиента
      const customer = await db.from('users').where('id', id).first()

      if (!customer) {
        return response.status(404).json({ error: 'Customer not found' })
      }

      // Получаем продукты клиента
      const products = await db
        .from('user_products')
        .where('user_email', customer.email)
        .select('*')

      // Получаем платежи
      const payments = await db
        .from('payments')
        .where('customer_email', customer.email)
        .orderBy('created_at', 'desc')
        .limit(50)

      // Получаем платёжные методы
      const paymentMethods = await PaymentMethod.query()
        .where('customerEmail', customer.email)
        .orderBy('createdAt', 'desc')

      // Получаем мандаты
      const mandates = await Mandate.query()
        .where('customerEmail', customer.email)
        .orderBy('createdAt', 'desc')

      // Получаем ручные списания
      const manualCharges = await ManualCharge.query()
        .where('customerEmail', customer.email)
        .preload('paymentMethod')
        .preload('mandate')
        .orderBy('createdAt', 'desc')

      // Получаем реферальную статистику
      const referralStats = await db
        .from('referrals')
        .where('referrer_email', customer.email)
        .count('* as total')
        .sum('commission_earned as earned')
        .first()

      return response.json({
        customer,
        products,
        payments,
        paymentMethods: paymentMethods.map((pm) => pm.serialize()),
        mandates: mandates.map((m) => m.serialize()),
        manualCharges: manualCharges.map((mc) => mc.serialize()),
        referralStats: {
          totalInvites: referralStats?.total || 0,
          totalEarned: referralStats?.earned || 0,
        },
      })
    } catch (error) {
      console.error('Get customer error:', error)
      return response.status(500).json({ error: 'Failed to fetch customer details' })
    }
  }

  /**
   * Обновить данные клиента
   */
  async update({ params, request, response, auth }: HttpContext) {
    const { id } = params
    const data = request.only(['name', 'phone', 'status', 'notes'])

    try {
      const customer = await db.from('users').where('id', id).first()

      if (!customer) {
        return response.status(404).json({ error: 'Customer not found' })
      }

      // Логируем изменения
      await AuditLog.log({
        entity: 'customer',
        entityId: id,
        action: 'update',
        actorEmail: auth.user?.email || 'system',
        actorRole: 'admin',
        before: customer,
        after: { ...customer, ...data },
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      })

      // Обновляем данные
      await db.from('users').where('id', id).update({
        ...data,
        updated_at: new Date(),
      })

      return response.json({ success: true })
    } catch (error) {
      console.error('Update customer error:', error)
      return response.status(500).json({ error: 'Failed to update customer' })
    }
  }
}
