
exports.up = (knex) => knex.schema.createTable('categories', (table) => {
  table.increments('id');
  table.string('name');
  table.string('icon');
});

exports.down = (knex) => knex.schema.dropTable('categories');
