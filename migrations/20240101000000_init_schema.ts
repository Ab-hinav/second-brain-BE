import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Ensure the extension for UUID generation is available (if using uuid-ossp, but gen_random_uuid is built-in in recent pg)
  // await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createSchema('app');

  await knex.schema.withSchema('app').createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.string('avatar_url').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.withSchema('app').createTable('brains', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('owner_id').notNullable().references('id').inTable('app.users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('description').nullable();
    table.boolean('is_default').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['owner_id', 'name']);
  });

  await knex.schema.withSchema('app').createTable('items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('brain_id').notNullable().references('id').inTable('app.brains').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.string('content_type').notNullable();
    table.string('url').nullable();
    table.boolean('is_pinned').defaultTo(false);
    table.jsonb('metadata').nullable();
    table.uuid('created_by').notNullable().references('id').inTable('app.users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.withSchema('app').createTable('tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('brain_id').notNullable().references('id').inTable('app.brains').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('color').notNullable();

    table.unique(['brain_id', 'name']);
  });

  await knex.schema.withSchema('app').createTable('item_tags', (table) => {
    table.uuid('item_id').notNullable().references('id').inTable('app.items').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('id').inTable('app.tags').onDelete('CASCADE');

    table.primary(['item_id', 'tag_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('app').dropTableIfExists('item_tags');
  await knex.schema.withSchema('app').dropTableIfExists('tags');
  await knex.schema.withSchema('app').dropTableIfExists('items');
  await knex.schema.withSchema('app').dropTableIfExists('brains');
  await knex.schema.withSchema('app').dropTableIfExists('users');
  await knex.schema.dropSchemaIfExists('app');
}
