import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  public async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])
      
      if (!email || !password) {
        return response.status(400).json({ 
          success: false, 
          message: 'Missing credentials' 
        })
      }

      // Ищем пользователя по email
      const user = await User.findBy('email', email)
      
      if (!user) {
        return response.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        })
      }

      // Проверяем пароль
      const isPasswordValid = await user.verify(password)
      
      if (!isPasswordValid) {
        return response.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        })
      }

      // Создаём токен доступа
      const token = await User.accessTokens.create(user)

      return response.json({ 
        success: true,
        token: token.value!.release(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        }
      })
    } catch (e) {
      console.error('Login error:', e)
      return response.status(500).json({ 
        success: false, 
        message: 'Internal error' 
      })
    }
  }
}


