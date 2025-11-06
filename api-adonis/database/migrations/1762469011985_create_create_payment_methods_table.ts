import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_methods'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('customer_email').notNullable().index()
      table.string('provider').notNullable().defaultTo('tinkoff')
      table.string('rebill_id').notNullable().unique()
      table.string('pan_mask', 20).notNullable()
      table.string('exp_date', 10)
      table.string('card_type', 50)
      table.enum('status', ['active', 'expired', 'revoked']).defaultTo('active')
      table.boolean('is_default').defaultTo(false)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
