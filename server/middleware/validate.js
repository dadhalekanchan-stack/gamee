const { body } = require('express-validator')

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username must be alphanumeric'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
]

const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]

const validateEvaluate = [
  body('player_id')
    .isUUID()
    .withMessage('player_id must be a valid UUID'),
  body('question_id')
    .isInt({ min: 1 })
    .withMessage('question_id must be an integer greater than 0'),
  body('selected_idx')
    .isInt({ min: 0, max: 3 })
    .withMessage('selected_idx must be between 0 and 3'),
  body('is_gym_battle')
    .isBoolean()
    .withMessage('is_gym_battle must be a boolean'),
]

const validateSync = [
  body('player_id')
    .isUUID()
    .withMessage('player_id must be a valid UUID'),
  body('map_x')
    .isInt({ min: 0, max: 10000 })
    .withMessage('map_x must be an integer between 0 and 10000'),
  body('map_y')
    .isInt({ min: 0, max: 10000 })
    .withMessage('map_y must be an integer between 0 and 10000'),
]

module.exports = {
  validateRegister,
  validateLogin,
  validateEvaluate,
  validateSync,
}

