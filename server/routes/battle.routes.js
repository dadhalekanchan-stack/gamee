const express = require('express')
const { validateEvaluate } = require('../middleware/validate')
const { evaluateBattle } = require('../controllers/battle.controller')

const router = express.Router()

router.post('/battle/evaluate', validateEvaluate, evaluateBattle)

module.exports = router

