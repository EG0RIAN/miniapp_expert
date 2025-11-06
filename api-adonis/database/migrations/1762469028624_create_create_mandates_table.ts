import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mandates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('customer_email').notNullable().index()
      table.enum('type', ['rko']).notNullable().defaultTo('rko')
      table.string('bank').notNullable().defaultTo('tinkoff')
      table.string('mandate_number').notNullable().unique()
      table.timestamp('signed_at', { useTz: true })
      table.enum('status', ['active', 'revoked', 'expired']).defaultTo('active')
      table.string('file_url')
      table.text('notes')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
