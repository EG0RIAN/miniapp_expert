import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Mandate extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare customerEmail: string

  @column()
  declare type: 'rko'

  @column()
  declare bank: string

  @column()
  declare mandateNumber: string

  @column.dateTime()
  declare signedAt: DateTime | null

  @column()
  declare status: 'active' | 'revoked' | 'expired'

  @column()
  declare fileUrl: string | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
