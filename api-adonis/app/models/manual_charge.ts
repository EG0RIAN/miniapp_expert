import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PaymentMethod from './payment_method.js'
import Mandate from './mandate.js'

export default class ManualCharge extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare customerEmail: string

  @column()
  declare amount: number

  @column()
  declare currency: string

  @column()
  declare reason: string

  @column()
  declare channel: 'tinkoff_mit' | 'tinkoff_rko'

  @column()
  declare status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled'

  @column()
  declare providerRef: string | null

  @column()
  declare failureReason: string | null

  @column()
  declare initiatorEmail: string

  @column()
  declare paymentMethodId: string | null

  @column()
  declare mandateId: string | null

  @column()
  declare idempotencyKey: string | null

  @column.dateTime()
  declare processedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => PaymentMethod)
  declare paymentMethod: BelongsTo<typeof PaymentMethod>

  @belongsTo(() => Mandate)
  declare mandate: BelongsTo<typeof Mandate>
}
