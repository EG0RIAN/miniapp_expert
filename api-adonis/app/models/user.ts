import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'client' | 'admin' | 'finance_manager'

  @column()
  declare emailVerified: boolean

  @column()
  declare verificationToken: string | null

  @column()
  declare resetToken: string | null

  @column.dateTime()
  declare resetTokenExpiresAt: DateTime | null

  @column.dateTime()
  declare offerAcceptedAt: DateTime | null

  @column()
  declare offerVersion: string | null

  @column()
  declare telegramId: string | null

  @column()
  declare referralCode: string | null

  @column()
  declare referredBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)
}