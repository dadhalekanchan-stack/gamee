require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();


const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const db = require('./db/pool')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json())

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api', require('./routes/encounter.routes'))
app.use('/api', require('./routes/battle.routes'))
app.use('/api', require('./routes/player.routes'))

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch(console.error)

