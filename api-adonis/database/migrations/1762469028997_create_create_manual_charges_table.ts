import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'manual_charges'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('customer_email').notNullable().index()
      table.decimal('amount', 12, 2).notNullable()
      table.string('currency', 3).notNullable().defaultTo('RUB')
      table.text('reason').notNullable()
      table.enum('channel', ['tinkoff_mit', 'tinkoff_rko']).notNullable()
      table.enum('status', ['pending', 'processing', 'success', 'failed', 'cancelled']).defaultTo('pending')
      table.string('provider_ref')
      table.text('failure_reason')
      table.string('initiator_email').notNullable()
      table.uuid('payment_method_id').references('id').inTable('payment_methods').onDelete('SET NULL')
      table.uuid('mandate_id').references('id').inTable('mandates').onDelete('SET NULL')
      table.string('idempotency_key').unique()
      table.timestamp('processed_at', { useTz: true })
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
