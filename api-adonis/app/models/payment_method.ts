import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class PaymentMethod extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare customerEmail: string

  @column()
  declare provider: string

  @column()
  declare rebillId: string

  @column()
  declare panMask: string

  @column()
  declare expDate: string | null

  @column()
  declare cardType: string | null

  @column()
  declare status: 'active' | 'expired' | 'revoked'

  @column()
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
