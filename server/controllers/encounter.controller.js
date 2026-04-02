const db = require('../db/pool')

const ALLOWED_ZONES = ['physics_town', 'math_town', 'chem_town']
const ALLOWED_DIFFICULTIES = ['basic', 'intermediate']

async function getEncounter(req, res, next) {
  try {
    const { zone, difficulty } = req.query

    if (!ALLOWED_ZONES.includes(zone)) {
      return res.status(400).json({ error: 'Invalid zone' })
    }

    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty' })
    }

    const rows = await db.query(
      `SELECT id, question_text, options, subject
       FROM questions
       WHERE zone = $1 AND difficulty = $2
       ORDER BY RANDOM()
       LIMIT 1`,
      [zone, difficulty],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this zone and difficulty' })
    }

    return res.status(200).json(rows[0])
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  getEncounter,
}

