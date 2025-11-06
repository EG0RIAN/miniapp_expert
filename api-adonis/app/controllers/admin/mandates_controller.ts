import type { HttpContext } from '@adonisjs/core/http'
import Mandate from '#models/mandate'
import AuditLog from '#models/audit_log'
import { DateTime } from 'luxon'

export default class MandatesController {
  /**
   * Получить список мандатов
   */
  async index({ request, response }: HttpContext) {
    const { customerEmail, status, page = 1, limit = 20 } = request.qs()

    try {
      let query = Mandate.query().orderBy('createdAt', 'desc')

      if (customerEmail) {
        query = query.where('customerEmail', customerEmail)
      }

      if (status) {
        query = query.where('status', status)
      }

      const mandates = await query.paginate(page, limit)

      return response.json({
        mandates: mandates.all().map((m) => m.serialize()),
        meta: mandates.getMeta(),
      })
    } catch (error) {
      console.error('Get mandates error:', error)
      return response.status(500).json({ error: 'Failed to fetch mandates' })
    }
  }

  /**
   * Создать мандат
   */
  async store({ request, response, auth }: HttpContext) {
    const { customerEmail, type = 'rko', bank = 'tinkoff', mandateNumber, fileUrl, notes } =
      request.only(['customerEmail', 'type', 'bank', 'mandateNumber', 'fileUrl', 'notes'])

    try {
      const mandate = await Mandate.create({
        customerEmail,
        type,
        bank,
        mandateNumber,
        signedAt: DateTime.now(),
        status: 'active',
        fileUrl,
        notes,
      })

      await AuditLog.log({
        entity: 'mandate',
        entityId: mandate.id,
        action: 'create',
        actorEmail: auth.user?.email || 'system',
        actorRole: 'admin',
        after: mandate.serialize(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      })

      return response.json({ mandateId: mandate.id, mandate: mandate.serialize() })
    } catch (error: any) {
      console.error('Create mandate error:', error)
      return response.status(500).json({ error: error.message || 'Failed to create mandate' })
    }
  }

  /**
   * Получить детали мандата
   */
  async show({ params, response }: HttpContext) {
    const { id } = params

    try {
      const mandate = await Mandate.findOrFail(id)
      return response.json(mandate.serialize())
    } catch (error) {
      console.error('Get mandate error:', error)
      return response.status(404).json({ error: 'Mandate not found' })
    }
  }

  /**
   * Обновить мандат
   */
  async update({ params, request, response, auth }: HttpContext) {
    const { id } = params
    const { status, fileUrl, notes } = request.only(['status', 'fileUrl', 'notes'])

    try {
      const mandate = await Mandate.findOrFail(id)
      const before = mandate.serialize()

      if (status) mandate.status = status
      if (fileUrl !== undefined) mandate.fileUrl = fileUrl
      if (notes !== undefined) mandate.notes = notes

      await mandate.save()

      await AuditLog.log({
        entity: 'mandate',
        entityId: mandate.id,
        action: 'update',
        actorEmail: auth.user?.email || 'system',
        actorRole: 'admin',
        before,
        after: mandate.serialize(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') || undefined,
      })

      return response.json({ success: true, mandate: mandate.serialize() })
    } catch (error) {
      console.error('Update mandate error:', error)
      return response.status(500).json({ error: 'Failed to update mandate' })
    }
  }

  /**
   * Отозвать мандат
   */
  async revoke({ params, response, auth }: HttpContext) {
    const { id } = params

    try {
      const mandate = await Mandate.findOrFail(id)
      const before = mandate.serialize()

      mandate.status = 'revoked'
      await mandate.save()

      await AuditLog.log({
        entity: 'mandate',
        entityId: mandate.id,
        action: 'revoke',
        actorEmail: auth.user?.email || 'system',
        actorRole: 'admin',
        before,
        after: mandate.serialize(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') || undefined,
      })

      return response.json({ success: true })
    } catch (error) {
      console.error('Revoke mandate error:', error)
      return response.status(500).json({ error: 'Failed to revoke mandate' })
    }
  }
}
