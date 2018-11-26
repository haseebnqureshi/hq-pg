
var path = require('path')

var envPath = path.resolve(__dirname, '..', '.env')

require('dotenv').config({ path: envPath })

//@todo somehow, foreign integers are returning as strings?

module.exports.development = module.exports.production = {
  client: 'pg',
  connection: {
    host:     process.env.PG_HOST,
    user:     process.env.PG_USER,
    password: process.env.PG_PASS,
    database: process.env.PG_DB
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
}
