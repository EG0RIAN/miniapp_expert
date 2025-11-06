import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { sendPasswordResetEmail, sendPasswordChangedEmail, createMagicToken } from '#services/mailer'
import bcrypt from 'bcrypt'

export default class PasswordResetsController {
  /**
   * Запрос на восстановление пароля
   */
  async requestReset({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    try {
      // Находим пользователя
      const user = await db.from('users').where('email', email).first()

      // Всегда возвращаем успех (для безопасности, чтобы не раскрывать существование email)
      if (!user) {
        return response.json({
          success: true,
          message: 'Если email существует, письмо с инструкциями будет отправлено',
        })
      }

      // Создаём токен сброса пароля (действителен 1 час)
      const resetToken = createMagicToken({ 
        email, 
        action: 'reset_password',
        exp: Date.now() + 60 * 60 * 1000 // 1 час
      })

      // Сохраняем токен в БД
      await db
        .from('users')
        .where('id', user.id)
        .update({
          reset_token: resetToken,
          reset_token_expires: new Date(Date.now() + 60 * 60 * 1000),
          updated_at: new Date(),
        })

      // Отправляем письмо
      await sendPasswordResetEmail({
        to: email,
        name: user.name,
        resetToken,
      })

      return response.json({
        success: true,
        message: 'Если email существует, письмо с инструкциями будет отправлено',
      })
    } catch (error: any) {
      console.error('Password reset request error:', error)
      return response.status(500).json({ error: 'Ошибка при запросе восстановления пароля' })
    }
  }

  /**
   * Проверка токена сброса пароля
   */
  async verifyToken({ request, response }: HttpContext) {
    const { token } = request.qs()

    if (!token) {
      return response.status(400).json({ error: 'Токен не предоставлен' })
    }

    try {
      const user = await db
        .from('users')
        .where('reset_token', token)
        .where('reset_token_expires', '>', new Date())
        .first()

      if (!user) {
        return response.status(400).json({ 
          error: 'Неверный или истёкший токен',
          expired: true 
        })
      }

      return response.json({
        success: true,
        email: user.email,
      })
    } catch (error: any) {
      console.error('Token verification error:', error)
      return response.status(500).json({ error: 'Ошибка при проверке токена' })
    }
  }

  /**
   * Сброс пароля
   */
  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = request.only(['token', 'password'])

    if (!token || !password) {
      return response.status(400).json({ error: 'Токен и пароль обязательны' })
    }

    if (password.length < 8) {
      return response.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' })
    }

    try {
      // Находим пользователя по токену
      const user = await db
        .from('users')
        .where('reset_token', token)
        .where('reset_token_expires', '>', new Date())
        .first()

      if (!user) {
        return response.status(400).json({ 
          error: 'Неверный или истёкший токен',
          expired: true 
        })
      }

      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(password, 10)

      // Обновляем пароль и удаляем токен
      await db
        .from('users')
        .where('id', user.id)
        .update({
          password: hashedPassword,
          reset_token: null,
          reset_token_expires: null,
          updated_at: new Date(),
        })

      // Отправляем уведомление об изменении пароля
      await sendPasswordChangedEmail({
        to: user.email,
        name: user.name,
      })

      return response.json({
        success: true,
        message: 'Пароль успешно изменён! Теперь вы можете войти с новым паролем',
      })
    } catch (error: any) {
      console.error('Password reset error:', error)
      return response.status(500).json({ error: 'Ошибка при сбросе пароля' })
    }
  }
}
