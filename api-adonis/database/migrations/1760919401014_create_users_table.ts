import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.enum('role', ['client', 'admin', 'finance_manager']).defaultTo('client')
      table.boolean('email_verified').defaultTo(false)
      table.string('verification_token').nullable()
      table.string('reset_token').nullable()
      table.timestamp('reset_token_expires_at').nullable()
      table.timestamp('offer_accepted_at').nullable()
      table.string('offer_version').nullable()
      table.string('telegram_id').nullable()
      table.string('referral_code').nullable().unique()
      table.integer('referred_by').unsigned().nullable()
      table.foreign('referred_by').references('id').inTable('users').onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}