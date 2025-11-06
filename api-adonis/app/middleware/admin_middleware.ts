import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'

/**
 * Middleware для проверки прав администратора
 */
export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    // Проверяем авторизацию
    if (!auth.user) {
      return response.status(401).json({ error: 'Unauthorized' })
    }

    // Проверяем роль пользователя
    const user = await db
      .from('users')
      .where('email', auth.user.email)
      .first()

    if (!user) {
      return response.status(401).json({ error: 'User not found' })
    }

    // Проверяем роль (ADMIN или FINANCE_MANAGER)
    const allowedRoles = ['ADMIN', 'FINANCE_MANAGER']
    
    if (!user.role || !allowedRoles.includes(user.role.toUpperCase())) {
      return response.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      })
    }

    // Сохраняем роль в контексте для использования в контроллерах
    auth.user.role = user.role

    await next()
  }
}

