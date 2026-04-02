const express = require('express')
const { getEncounter } = require('../controllers/encounter.controller')

const router = express.Router()

router.get('/encounters', getEncounter)

module.exports = router

