/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema

    .createTable('settings', table => {
        table.string('key').notNullable().primary()
        table.json('value')
        table.string('updatedAt').notNullable()
    })

    // create table users
    .createTable('users', function (table) {
        table.uuid('id').primary();
        table.string('username').notNullable();
        table.string('name').notNullable();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })

    // create table groups
    .createTable('groups', function (table) {
        table.uuid('id').primary();
        table.string('name').notNullable();
        table.string('permission').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
    })

    .alterTable('groups', table => {
        table.uuid('user_id').references('id').inTable('users');
    })

    .createTable('apiKeys', table => {
        table.increments('id').primary()
        table.string('name').notNullable()
        table.text('key').notNullable()
        table.string('expiration').notNullable()
        table.boolean('isRevoked').notNullable().defaultTo(false)
        table.string('createdAt').notNullable()
        table.string('updatedAt').notNullable()
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
    
    .dropTableIfExists('users')
    
    .table('groups', function (table) {
        table.dropForeign('user_id')
    })
    .dropTableIfExists('groups');
};
