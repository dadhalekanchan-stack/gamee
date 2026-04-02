const { validationResult } = require('express-validator')
const db = require('../db/pool')

const THRESHOLDS = {
  1: 100,
  2: 300,
  3: 600,
  4: 1000,
  5: 1500,
  6: 2100,
  7: 2800,
  8: 3600,
  9: 4500,
}

async function evaluateBattle(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { player_id, question_id, selected_idx, is_gym_battle } = req.body
    if (req.player?.player_id && req.player.player_id !== player_id) {
      return res.status(403).json({ error: 'Forbidden: invalid player context' })
    }

    const questions = await db.query(
      'SELECT correct_idx, explanation, zone FROM questions WHERE id = $1',
      [question_id],
    )
    if (questions.length === 0) {
      return res.status(404).json({ error: 'Question not found' })
    }
    const question = questions[0]

    const isCorrect = Number(selected_idx) === Number(question.correct_idx)

    const players = await db.query(
      'SELECT level, exp FROM players WHERE id = $1',
      [player_id],
    )
    if (players.length === 0) {
      return res.status(404).json({ error: 'Player not found' })
    }
    const player = players[0]

    const response = {
      correct: isCorrect,
      exp_gained: 0,
      new_level: player.level,
      new_exp: player.exp,
      badge_earned: null,
      explanation: null,
    }

    if (isCorrect) {
      const expGained = is_gym_battle ? 100 : 10
      const newExp = player.exp + expGained
      let newLevel = player.level

      while (newLevel < 10 && newExp >= THRESHOLDS[newLevel]) {
        newLevel += 1
      }

      await db.query(
        'UPDATE players SET exp = $1, level = $2 WHERE id = $3',
        [newExp, newLevel, player_id],
      )

      let badgeName = null
      if (is_gym_battle) {
        badgeName = `${question.zone}_Badge`
        await db.query(
          `INSERT INTO player_badges (player_id, badge_name, zone)
           VALUES ($1, $2, $3)
           ON CONFLICT (player_id, badge_name) DO NOTHING`,
          [player_id, badgeName, question.zone],
        )
      }

      response.exp_gained = expGained
      response.new_level = newLevel
      response.new_exp = newExp
      response.badge_earned = badgeName
      response.explanation = question.explanation
    }

    return res.status(200).json(response)
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  evaluateBattle,
}

