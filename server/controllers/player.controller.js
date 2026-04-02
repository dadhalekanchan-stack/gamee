const db = require('../db/pool')
const { validationResult } = require('express-validator')

async function getPlayer(req, res, next) {
  try {
    const { id } = req.params
    if (req.player?.player_id !== id) {
      return res.status(403).json({ error: 'Forbidden: cannot access another player profile' })
    }

    const rows = await db.query(
      'SELECT id, username, level, exp, hp, max_hp, map_x, map_y FROM players WHERE id = $1',
      [id],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' })
    }

    return res.status(200).json(rows[0])
  } catch (err) {
    return next(err)
  }
}

async function syncPlayerPosition(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { player_id, map_x, map_y } = req.body
    if (req.player?.player_id !== player_id) {
      return res.status(403).json({ error: 'Forbidden: cannot sync another player' })
    }

    await db.query(
      'UPDATE players SET map_x = $1, map_y = $2 WHERE id = $3',
      [map_x, map_y, player_id],
    )

    return res.status(200).json({ synced: true })
  } catch (err) {
    return next(err)
  }
}

async function getBadges(req, res, next) {
  try {
    const { player_id } = req.params
    if (req.player?.player_id && req.player.player_id !== player_id) {
      return res.status(403).json({ error: 'Forbidden: cannot view another player badges' })
    }

    const rows = await db.query(
      'SELECT badge_name, zone, earned_at FROM player_badges WHERE player_id = $1 ORDER BY earned_at ASC',
      [player_id],
    )

    return res.status(200).json({ badges: rows })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  getPlayer,
  syncPlayerPosition,
  getBadges,
}

