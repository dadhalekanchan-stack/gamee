const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function query(text, params) {
  const result = await pool.query(text, params)
  return result.rows
}

async function init() {
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  await pool.query(schemaSql)
  console.log('Database initialized')
}

module.exports = {
  pool,
  query,
  init,
}

