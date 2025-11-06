import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class ProfilesController {
  /**
   * Получить профиль клиента
   */
  async show({ auth, response }: HttpContext) {
    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      const user = await db.from('users').where('email', userEmail).first()

      if (!user) {
        return response.status(404).json({ error: 'User not found' })
      }

      // Получаем настройки уведомлений
      const notificationSettings = await db
        .from('notification_settings')
        .where('user_email', userEmail)
        .first()

      // Проверяем согласие на оферту
      const offerConsent = await db
        .from('offer_consents')
        .where('user_email', userEmail)
        .orderBy('created_at', 'desc')
        .first()

      return response.json({
        email: user.email,
        name: user.name,
        phone: user.phone,
        notifications: {
          email: notificationSettings?.email_enabled ?? true,
          telegram: notificationSettings?.telegram_enabled ?? false,
        },
        offerAccepted: !!offerConsent,
        offerAcceptedAt: offerConsent?.created_at || null,
      })
    } catch (error) {
      console.error('Get profile error:', error)
      return response.status(500).json({ error: 'Failed to fetch profile' })
    }
  }

  /**
   * Обновить профиль клиента
   */
  async update({ auth, request, response }: HttpContext) {
    const { name, phone, notifications } = request.only(['name', 'phone', 'notifications'])

    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      // Обновляем основные данные
      if (name !== undefined || phone !== undefined) {
        await db
          .from('users')
          .where('email', userEmail)
          .update({
            ...(name !== undefined && { name }),
            ...(phone !== undefined && { phone }),
            updated_at: new Date(),
          })
      }

      // Обновляем настройки уведомлений
      if (notifications) {
        const existing = await db
          .from('notification_settings')
          .where('user_email', userEmail)
          .first()

        if (existing) {
          await db
            .from('notification_settings')
            .where('user_email', userEmail)
            .update({
              email_enabled: notifications.email ?? existing.email_enabled,
              telegram_enabled: notifications.telegram ?? existing.telegram_enabled,
              updated_at: new Date(),
            })
        } else {
          await db.table('notification_settings').insert({
            user_email: userEmail,
            email_enabled: notifications.email ?? true,
            telegram_enabled: notifications.telegram ?? false,
            created_at: new Date(),
          })
        }
      }

      // Получаем обновлённый профиль
      const updatedUser = await db.from('users').where('email', userEmail).first()

      const notificationSettings = await db
        .from('notification_settings')
        .where('user_email', userEmail)
        .first()

      return response.json({
        success: true,
        profile: {
          email: updatedUser.email,
          name: updatedUser.name,
          phone: updatedUser.phone,
          notifications: {
            email: notificationSettings?.email_enabled ?? true,
            telegram: notificationSettings?.telegram_enabled ?? false,
          },
        },
      })
    } catch (error) {
      console.error('Update profile error:', error)
      return response.status(500).json({ error: 'Failed to update profile' })
    }
  }

  /**
   * Принять оферту
   */
  async acceptOffer({ auth, request, response }: HttpContext) {
    const { offerVersion } = request.only(['offerVersion'])

    try {
      const userEmail = auth.user?.email

      if (!userEmail) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      const acceptedAt = DateTime.now()

      await db.table('offer_consents').insert({
        user_email: userEmail,
        offer_version: offerVersion || '1.0',
        ip_address: request.ip(),
        user_agent: request.header('user-agent'),
        created_at: acceptedAt.toJSDate(),
      })

      return response.json({
        success: true,
        acceptedAt: acceptedAt.toISO(),
      })
    } catch (error) {
      console.error('Accept offer error:', error)
      return response.status(500).json({ error: 'Failed to accept offer' })
    }
  }
}
