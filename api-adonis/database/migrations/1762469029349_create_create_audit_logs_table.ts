import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('entity').notNullable().index()
      table.string('entity_id').notNullable().index()
      table.string('action').notNullable()
      table.string('actor_email').notNullable().index()
      table.string('actor_role')
      table.jsonb('before')
      table.jsonb('after')
      table.string('ip_address', 45)
      table.string('user_agent')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
