const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const db = require('../db/pool')

async function register(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { username, password } = req.body

    const existing = await db.query('SELECT id FROM players WHERE username = $1', [username])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const players = await db.query(
      'INSERT INTO players (username, password) VALUES ($1, $2) RETURNING id, username, level, exp, hp, max_hp',
      [username, hashedPassword],
    )
    const player = players[0]

    const token = jwt.sign(
      { player_id: player.id, username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    )

    return res.status(201).json({ token, player })
  } catch (err) {
    return next(err)
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { username, password } = req.body

    const players = await db.query('SELECT * FROM players WHERE username = $1', [username])
    if (players.length === 0) {
      return res.status(404).json({ error: 'Player not found' })
    }

    const playerRecord = players[0]
    const isValidPassword = await bcrypt.compare(password, playerRecord.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { player_id: playerRecord.id, username: playerRecord.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    )

    const player = {
      id: playerRecord.id,
      username: playerRecord.username,
      level: playerRecord.level,
      exp: playerRecord.exp,
      hp: playerRecord.hp,
      max_hp: playerRecord.max_hp,
    }

    return res.status(200).json({ token, player })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  register,
  login,
}

