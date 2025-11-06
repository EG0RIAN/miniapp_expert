import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { sendRegistrationEmail, createMagicToken } from '#services/mailer'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

export default class RegistersController {
  /**
   * Регистрация нового пользователя
   */
  async register({ request, response }: HttpContext) {
    const { email, name, password } = request.only(['email', 'name', 'password'])

    try {
      // Проверяем, существует ли пользователь
      const existingUser = await db.from('users').where('email', email).first()

      if (existingUser) {
        return response.status(400).json({ error: 'Пользователь с таким email уже существует' })
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10)

      // Создаём токен подтверждения
      const verificationToken = createMagicToken({ email, action: 'verify' })

      // Создаём пользователя
      const userId = crypto.randomUUID()
      await db.table('users').insert({
        id: userId,
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        role: 'CLIENT',
        email_verified: false,
        verification_token: verificationToken,
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Отправляем письмо с подтверждением
      const emailSent = await sendRegistrationEmail({
        to: email,
        name: name || email.split('@')[0],
        verificationToken,
      })

      return response.json({
        success: true,
        message: 'Регистрация успешна! Проверьте email для подтверждения',
        emailSent,
        userId,
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      return response.status(500).json({ error: error.message || 'Ошибка при регистрации' })
    }
  }

  /**
   * Подтверждение email
   */
  async verify({ request, response }: HttpContext) {
    const { token } = request.qs()

    if (!token) {
      return response.status(400).json({ error: 'Токен не предоставлен' })
    }

    try {
      // Находим пользователя по токену
      const user = await db
        .from('users')
        .where('verification_token', token)
        .where('email_verified', false)
        .first()

      if (!user) {
        return response.status(400).json({ error: 'Неверный или истёкший токен' })
      }

      // Подтверждаем email
      await db
        .from('users')
        .where('id', user.id)
        .update({
          email_verified: true,
          verification_token: null,
          updated_at: new Date(),
        })

      return response.json({
        success: true,
        message: 'Email успешно подтверждён! Теперь вы можете войти в систему',
      })
    } catch (error: any) {
      console.error('Email verification error:', error)
      return response.status(500).json({ error: 'Ошибка при подтверждении email' })
    }
  }
}
