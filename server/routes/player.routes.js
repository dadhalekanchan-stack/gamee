const express = require('express')
const authMiddleware = require('../middleware/auth.middleware')
const { validateSync } = require('../middleware/validate')
const {
  getPlayer,
  syncPlayerPosition,
  getBadges,
} = require('../controllers/player.controller')

const router = express.Router()

router.get('/player/:id', authMiddleware, getPlayer)
router.post('/player/sync', authMiddleware, validateSync, syncPlayerPosition)
router.get('/badges/:player_id', getBadges)

module.exports = router

