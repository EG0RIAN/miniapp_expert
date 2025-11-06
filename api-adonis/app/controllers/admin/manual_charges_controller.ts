import type { HttpContext } from '@adonisjs/core/http'
import ManualCharge from '#models/manual_charge'
import PaymentMethod from '#models/payment_method'
import Mandate from '#models/mandate'
import AuditLog from '#models/audit_log'
import TBankService from '#services/tbank_service'
import { DateTime } from 'luxon'
import crypto from 'crypto'

export default class ManualChargesController {
  private tbankService: TBankService

  constructor() {
    this.tbankService = new TBankService()
  }

  /**
   * Получить список ручных списаний
   */
  async index({ request, response }: HttpContext) {
    const { customerId, customerEmail, status, page = 1, limit = 20 } = request.qs()

    try {
      let query = ManualCharge.query()
        .preload('paymentMethod')
        .preload('mandate')
        .orderBy('createdAt', 'desc')

      if (customerEmail) {
        query = query.where('customerEmail', customerEmail)
      }

      if (status) {
        query = query.where('status', status)
      }

      const charges = await query.paginate(page, limit)

      return response.json({
        charges: charges.all().map((c) => c.serialize()),
        meta: charges.getMeta(),
      })
    } catch (error) {
      console.error('Get manual charges error:', error)
      return response.status(500).json({ error: 'Failed to fetch manual charges' })
    }
  }

  /**
   * Создать ручное списание
   */
  async store({ request, response, auth }: HttpContext) {
    const {
      customerEmail,
      amount,
      currency = 'RUB',
      reason,
      channel,
      paymentMethodId,
      mandateId,
      twoFactorCode,
    } = request.only([
      'customerEmail',
      'amount',
      'currency',
      'reason',
      'channel',
      'paymentMethodId',
      'mandateId',
      'twoFactorCode',
    ])

    try {
      // TODO: Проверка 2FA кода (реализовать отдельно)
      if (!twoFactorCode) {
        return response.status(400).json({ error: '2FA code required' })
      }

      // Генерируем уникальный idempotency key
      const idempotencyKey = crypto.randomUUID()
      const orderId = `MANUAL_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

      // Создаём запись о списании
      const charge = await ManualCharge.create({
        customerEmail,
        amount,
        currency,
        reason,
        channel,
        status: 'pending',
        initiatorEmail: auth.user?.email || 'system',
        paymentMethodId: channel === 'tinkoff_mit' ? paymentMethodId : null,
        mandateId: channel === 'tinkoff_rko' ? mandateId : null,
        idempotencyKey,
      })

      // Логируем создание
      await AuditLog.log({
        entity: 'manual_charge',
        entityId: charge.id,
        action: 'create',
        actorEmail: auth.user?.email || 'system',
        actorRole: 'admin',
        after: charge.serialize(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      })

      // Обрабатываем списание в зависимости от канала
      if (channel === 'tinkoff_mit') {
        // MIT списание
        const paymentMethod = await PaymentMethod.findOrFail(paymentMethodId)

        try {
          charge.status = 'processing'
          await charge.save()

          const result = await this.tbankService.chargeMIT({
            rebillId: paymentMethod.rebillId,
            amount,
            orderId,
            description: reason,
            customerEmail,
          })

          if (result.Success) {
            charge.status = 'success'
            charge.providerRef = result.PaymentId || null
            charge.processedAt = DateTime.now()
          } else {
            charge.status = 'failed'
            charge.failureReason = result.Message || result.ErrorCode || 'Unknown error'
          }

          await charge.save()

          // Логируем результат
          await AuditLog.log({
            entity: 'manual_charge',
            entityId: charge.id,
            action: 'processed',
            actorEmail: 'system',
            actorRole: 'tbank_api',
            before: { status: 'processing' },
            after: charge.serialize(),
          })
        } catch (error: any) {
          charge.status = 'failed'
          charge.failureReason = error.message
          await charge.save()

          await AuditLog.log({
            entity: 'manual_charge',
            entityId: charge.id,
            action: 'failed',
            actorEmail: 'system',
            after: { error: error.message },
          })
        }
      } else if (channel === 'tinkoff_rko') {
        // РКО списание - помечаем как обработанное вручную
        charge.status = 'processing'
        await charge.save()

        // Генерируем платёжное требование
        const mandate = await Mandate.findOrFail(mandateId)
        const paymentOrder = this.tbankService.generateRKOPaymentOrder({
          mandateNumber: mandate.mandateNumber,
          customerName: customerEmail,
          amount,
          purpose: reason,
          date: new Date(),
        })

        // Логируем генерацию требования
        await AuditLog.log({
          entity: 'manual_charge',
          entityId: charge.id,
          action: 'rko_order_generated',
          actorEmail: auth.user?.email || 'system',
          after: { paymentOrder },
        })
      }

      return response.json({
        chargeId: charge.id,
        status: charge.status,
        providerRef: charge.providerRef,
      })
    } catch (error: any) {
      console.error('Create manual charge error:', error)
      return response.status(500).json({ error: error.message || 'Failed to create manual charge' })
    }
  }

  /**
   * Получить детали списания
   */
  async show({ params, response }: HttpContext) {
    const { id } = params

    try {
      const charge = await ManualCharge.query()
        .where('id', id)
        .preload('paymentMethod')
        .preload('mandate')
        .firstOrFail()

      return response.json(charge.serialize())
    } catch (error) {
      console.error('Get manual charge error:', error)
      return response.status(404).json({ error: 'Manual charge not found' })
    }
  }

  /**
   * Отменить списание
   */
  async cancel({ params, response, auth }: HttpContext) {
    const { id } = params

    try {
      const charge = await ManualCharge.findOrFail(id)

      if (charge.status !== 'pending' && charge.status !== 'processing') {
        return response.status(400).json({ error: 'Cannot cancel charge in current status' })
      }

      const before = charge.serialize()
      charge.status = 'cancelled'
      await charge.save()

      await AuditLog.log({
        entity: 'manual_charge',
        entityId: charge.id,
        action: 'cancel',
        actorEmail: auth.user?.email || 'system',
        actorRole: 'admin',
        before,
        after: charge.serialize(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      })

      return response.json({ success: true })
    } catch (error) {
      console.error('Cancel manual charge error:', error)
      return response.status(500).json({ error: 'Failed to cancel charge' })
    }
  }
}
