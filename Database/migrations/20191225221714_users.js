
exports.up = function (knex) {
    return knex.schema.createTable('users', table => {
        table.increments('id')
        table.string('name', 60)
        table.string('username', 40)
        table.string('password', 191)
        table.integer('role_id').unsigned()
        table.dateTime('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'))
        table.dateTime('updated_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))

        table.unique('username')
        table.foreign('role_id').references('roles.id').onDelete('cascade').onUpdate('cascade')
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('users')
};
