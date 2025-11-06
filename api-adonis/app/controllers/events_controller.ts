import type { HttpContext } from '@adonisjs/core/http'
import pocketbase from '#services/pocketbase'

export default class EventsController {
  public async create({ request, response }: HttpContext) {
    try {
      const ok = await pocketbase.ensureAdminAuth()
      if (ok) {
        try {
          await pocketbase.client.collection('events').create(request.body())
        } catch {}
      }
      return response.json({ success: true })
    } catch (e) {
      return response.status(500).json({ success: false })
    }
  }
}


