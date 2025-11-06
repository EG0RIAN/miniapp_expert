import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare entity: string

  @column()
  declare entityId: string

  @column()
  declare action: string

  @column()
  declare actorEmail: string

  @column()
  declare actorRole: string | null

  @column()
  declare before: Record<string, any> | null

  @column()
  declare after: Record<string, any> | null

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  static async log(data: {
    entity: string
    entityId: string
    action: string
    actorEmail: string
    actorRole?: string
    before?: Record<string, any>
    after?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }) {
    return await this.create(data)
  }
}
