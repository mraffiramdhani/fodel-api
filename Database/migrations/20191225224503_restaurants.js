
exports.up = function (knex) {
    return knex.schema.createTable('restaurants', table => {
        table.increments('id')
        table.string('name')
        table.string('logo').nullable()
        table.string('longitude').nullable()
        table.string('latitude').nullable()
        table.text('description').nullable()
        table.integer('user_id').unsigned()
        table.dateTime('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'))
        table.dateTime('updated_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
        table.boolean('active').defaultTo(0);

        table.foreign('user_id').references('users.id').onDelete('cascade').onUpdate('cascade')
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('restaurants')
};
