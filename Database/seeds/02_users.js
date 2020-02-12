const faker = require('faker'),
  bcrypt = require('bcryptjs');


let createRecord = (knex, id, role_id) => {
  return knex('users').insert({
    id,
    name: faker.name.findName(),
    username: faker.internet.userName(),
    password: bcrypt.hashSync('password'),
    photo: 'default.png',
    role_id,
    created_at: new Date(),
    updated_at: new Date()
  })
}

exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {

      let records = []
      let roles = [1, 2, 2, 2, 2, 3, 3, 3, 3, 3]
      // Inserts seed entries
      for (let i = 0; i < roles.length; i++) {
        records.push(createRecord(knex, (i+1), roles[i]))
      }

      console.log('users seed')
      return Promise.all(records)
    });
};
