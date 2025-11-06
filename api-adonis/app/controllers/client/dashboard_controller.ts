import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class DashboardController {
  /**
   * Получить данные для дашборда клиента
   */
  async index({ auth, response }: HttpContext) {
    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      // Получаем баланс (если есть система балансов)
      const balanceData = await db
        .from('user_balances')
        .where('email', userEmail)
        .first()

      const balance = balanceData?.balance || 0

      // Получаем активные продукты
      const activeProducts = await db
        .from('user_products')
        .where('user_email', userEmail)
        .where('status', 'active')
        .select('*')

      // Получаем подписки
      const subscriptions = await db
        .from('subscriptions')
        .where('user_email', userEmail)
        .where('status', 'active')
        .select('*')

      // Получаем последние транзакции
      const recentTransactions = await db
        .from('payments')
        .where('customer_email', userEmail)
        .orderBy('created_at', 'desc')
        .limit(5)
        .select('*')

      // Получаем уведомления
      const notifications = await db
        .from('notifications')
        .where('user_email', userEmail)
        .where('read', false)
        .orderBy('created_at', 'desc')
        .limit(10)
        .select('*')

      // Получаем реферальную статистику
      const referralStats = await db
        .from('referrals')
        .where('referrer_email', userEmail)
        .select(
          db.raw('COUNT(*) as invites'),
          db.raw('SUM(commission_earned) as earned')
        )
        .first()

      return response.json({
        balance,
        activeProducts,
        subscriptions,
        recentTransactions,
        notifications,
        referralStats: {
          invites: referralStats?.invites || 0,
          earned: referralStats?.earned || 0,
        },
      })
    } catch (error) {
      console.error('Dashboard error:', error)
      return response.status(500).json({ error: 'Failed to load dashboard' })
    }
  }
}
