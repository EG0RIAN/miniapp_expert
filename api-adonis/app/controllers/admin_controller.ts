import type { HttpContext } from '@adonisjs/core/http'
import pocketbase from '#services/pocketbase'

export default class AdminController {
  public async events({ response }: HttpContext) {
    try {
      const ok = await pocketbase.ensureAdminAuth()
      if (ok) {
        const result = await pocketbase.client.collection('events').getList(1, 200, { sort: '-created' })
        return response.json({ success: true, items: result.items })
      }
      return response.json({ success: true, items: [] })
    } catch (e) {
      return response.status(500).json({ success: false, items: [] })
    }
  }

  public async abandoned({ response }: HttpContext) {
    try {
      const ok = await pocketbase.ensureAdminAuth()
      if (ok) {
        const result = await pocketbase.client
          .collection('abandoned_carts')
          .getList(1, 200, { sort: '-updated' })
        return response.json({ success: true, items: result.items })
      }
      return response.json({ success: true, items: [] })
    } catch (e) {
      return response.status(500).json({ success: false, items: [] })
    }
  }
}


