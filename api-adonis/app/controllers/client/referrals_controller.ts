import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import crypto from 'crypto'
import env from '#start/env'

export default class ReferralsController {
  /**
   * Получить реферальную информацию клиента
   */
  async index({ auth, response }: HttpContext) {
    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      // Получаем или создаём реферальный код
      let referralCode = await db
        .from('referral_codes')
        .where('user_email', userEmail)
        .first()

      if (!referralCode) {
        // Создаём новый реферальный код
        const code = crypto.randomBytes(6).toString('hex')
        await db.table('referral_codes').insert({
          id: crypto.randomUUID(),
          user_email: userEmail,
          code,
          created_at: new Date(),
        })
        referralCode = { code }
      }

      const referralLink = `${env.get('APP_BASE_URL')}/register?ref=${referralCode.code}`

      // Получаем статистику приглашённых
      const invites = await db
        .from('referrals')
        .where('referrer_email', userEmail)
        .select('*')

      const stats = await db
        .from('referrals')
        .where('referrer_email', userEmail)
        .select(
          db.raw('COUNT(*) as total_invites'),
          db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_invites'),
          db.raw('SUM(commission_earned) as total_earned'),
          db.raw('SUM(CASE WHEN payout_status = \'pending\' THEN commission_earned ELSE 0 END) as available_balance')
        )
        .first()

      // Получаем историю выплат
      const payouts = await db
        .from('referral_payouts')
        .where('user_email', userEmail)
        .orderBy('created_at', 'desc')
        .select('*')

      return response.json({
        referralLink,
        stats: {
          totalInvites: parseInt(stats?.total_invites || '0'),
          activeInvites: parseInt(stats?.active_invites || '0'),
          totalEarned: parseFloat(stats?.total_earned || '0'),
          availableBalance: parseFloat(stats?.available_balance || '0'),
        },
        invites: invites.map((inv) => ({
          email: inv.invited_email,
          registeredAt: inv.created_at,
          status: inv.status,
          earnedFromUser: inv.commission_earned,
        })),
        payouts: payouts.map((p) => ({
          amount: p.amount,
          status: p.status,
          createdAt: p.created_at,
        })),
      })
    } catch (error) {
      console.error('Get referrals error:', error)
      return response.status(500).json({ error: 'Failed to fetch referral data' })
    }
  }

  /**
   * Запросить выплату реферального вознаграждения
   */
  async requestPayout({ auth, request, response }: HttpContext) {
    const { amount, method = 'card' } = request.only(['amount', 'method'])

    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      // Проверяем доступный баланс
      const stats = await db
        .from('referrals')
        .where('referrer_email', userEmail)
        .where('payout_status', 'pending')
        .sum('commission_earned as available')
        .first()

      const availableBalance = parseFloat(stats?.available || '0')

      if (amount > availableBalance) {
        return response.status(400).json({ error: 'Insufficient balance' })
      }

      // Создаём запрос на выплату
      const payoutId = crypto.randomUUID()

      await db.table('referral_payouts').insert({
        id: payoutId,
        user_email: userEmail,
        amount,
        method,
        status: 'pending',
        created_at: new Date(),
      })

      // Помечаем рефералов как обработанные
      await db
        .from('referrals')
        .where('referrer_email', userEmail)
        .where('payout_status', 'pending')
        .update({ payout_status: 'processing' })

      return response.json({
        success: true,
        payoutId,
        message: 'Payout request created successfully',
      })
    } catch (error) {
      console.error('Request payout error:', error)
      return response.status(500).json({ error: 'Failed to request payout' })
    }
  }
}
