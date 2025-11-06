import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'
import { DateTime } from 'luxon'

export default class AuditLogsController {
  /**
   * Получить журнал аудита с фильтрацией
   */
  async index({ request, response }: HttpContext) {
    const {
      entity,
      entityId,
      actor,
      startDate,
      endDate,
      action,
      page = 1,
      limit = 50,
    } = request.qs()

    try {
      let query = AuditLog.query().orderBy('createdAt', 'desc')

      if (entity) {
        query = query.where('entity', entity)
      }

      if (entityId) {
        query = query.where('entityId', entityId)
      }

      if (actor) {
        query = query.where('actorEmail', 'ilike', `%${actor}%`)
      }

      if (action) {
        query = query.where('action', action)
      }

      if (startDate) {
        const start = DateTime.fromISO(startDate)
        if (start.isValid) {
          query = query.where('createdAt', '>=', start.toSQL())
        }
      }

      if (endDate) {
        const end = DateTime.fromISO(endDate)
        if (end.isValid) {
          query = query.where('createdAt', '<=', end.toSQL())
        }
      }

      const logs = await query.paginate(page, limit)

      return response.json({
        logs: logs.all().map((log) => log.serialize()),
        meta: logs.getMeta(),
      })
    } catch (error) {
      console.error('Get audit logs error:', error)
      return response.status(500).json({ error: 'Failed to fetch audit logs' })
    }
  }

  /**
   * Получить детали лога
   */
  async show({ params, response }: HttpContext) {
    const { id } = params

    try {
      const log = await AuditLog.findOrFail(id)
      return response.json(log.serialize())
    } catch (error) {
      console.error('Get audit log error:', error)
      return response.status(404).json({ error: 'Audit log not found' })
    }
  }

  /**
   * Получить статистику аудита
   */
  async stats({ request, response }: HttpContext) {
    const { startDate, endDate } = request.qs()

    try {
      let query = AuditLog.query()

      if (startDate) {
        const start = DateTime.fromISO(startDate)
        if (start.isValid) {
          query = query.where('createdAt', '>=', start.toSQL())
        }
      }

      if (endDate) {
        const end = DateTime.fromISO(endDate)
        if (end.isValid) {
          query = query.where('createdAt', '<=', end.toSQL())
        }
      }

      const logs = await query.select('entity', 'action', 'actorEmail')

      // Группируем статистику
      const stats = {
        totalActions: logs.length,
        byEntity: {} as Record<string, number>,
        byAction: {} as Record<string, number>,
        byActor: {} as Record<string, number>,
      }

      logs.forEach((log) => {
        // По сущностям
        stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1

        // По действиям
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1

        // По актёрам
        stats.byActor[log.actorEmail] = (stats.byActor[log.actorEmail] || 0) + 1
      })

      return response.json(stats)
    } catch (error) {
      console.error('Get audit stats error:', error)
      return response.status(500).json({ error: 'Failed to fetch audit stats' })
    }
  }
}
