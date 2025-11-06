import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

export default class AuthController {
  public async login({ request, response }: HttpContext) {
    try {
      const { username, password } = request.only(['username', 'password'])
      if (!username || !password) return response.status(400).json({ success: false, message: 'Missing credentials' })
      const ADMIN_USERNAME = (env.get('ADMIN_USERNAME', '') as string) || (env.get('ADMIN_USER', '') as string)
      const ADMIN_PASSWORD = (env.get('ADMIN_PASSWORD', '') as string) || (env.get('ADMIN_PASS', '') as string)
      if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        return response.status(503).json({ success: false, message: 'Password login is not configured' })
      }
      if (String(username) === String(ADMIN_USERNAME) && String(password) === String(ADMIN_PASSWORD)) {
        return response.json({ success: true, user: { username } })
      }
      return response.status(401).json({ success: false, message: 'Invalid username or password' })
    } catch (e) {
      return response.status(500).json({ success: false, message: 'Internal error' })
    }
  }
}


