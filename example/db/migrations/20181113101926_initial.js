
exports.up = function(knex, Promise) {

	return knex.schema
		.createTable('meals', t => {
			t.increments('id').primary()
			t.string('name').notNullable()
			t.timestamps()
		})
		.createTable('ingredients', t => {
			t.increments('id').primary()
			t.string('name').notNullable()
			t.string('units').notNullable()
			t.timestamps()
		})
		.createTable('meal_ingredients', t => {
			t.increments('id').primary()
			t.decimal('quantity')
			t.timestamps()
		})
		.createTable('users', t => {
			t.increments('id').primary()
			t.string('first_name').nullable()
			t.string('last_name').nullable()
			t.string('email').notNullable().unique()
			t.string('password').notNullable()
			t.timestamps()
		})
		.createTable('groups', t => {
			t.increments('id').primary()
			t.string('name').nullable()
			t.timestamps()
		})
		.createTable('devices', t => {
			t.increments('id').primary()
			t.string('token').notNullable()
			t.string('expiry').nullable()
			t.timestamp('expires_at').defaultTo(knex.fn.now())
			t.string('ip').notNullable()
			t.timestamps()
		})
		.table('meals', t => {
			t.integer('group_id').references('id').inTable('groups').notNull().onDelete('cascade')
		})
		.table('ingredients', t => {
			t.integer('group_id').references('id').inTable('groups').notNull().onDelete('cascade')
		})
		.table('meal_ingredients', t => {
			t.integer('meal_id').references('id').inTable('meals').notNull().onDelete('cascade')
			t.integer('ingredient_id').references('id').inTable('ingredients').notNull().onDelete('cascade')
			t.integer('group_id').references('id').inTable('groups').notNull().onDelete('cascade')
		})
		.table('users', t => {
			t.integer('group_id').references('id').inTable('groups').notNull().onDelete('cascade')
		})
		.table('devices', t => {
			t.integer('user_id').references('id').inTable('users').notNull().onDelete('cascade')
		})

};

exports.down = function(knex, Promise) {

	return knex
		.raw(`DROP TABLE meals CASCADE;
			DROP TABLE ingredients CASCADE;
			DROP TABLE meal_ingredients CASCADE;
			DROP TABLE users CASCADE;
			DROP TABLE groups CASCADE;
			DROP TABLE devices CASCADE`)

};
