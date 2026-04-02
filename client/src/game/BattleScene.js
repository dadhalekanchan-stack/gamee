import { HP_DAMAGE } from './constants'

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' })
  }

  init(data) {
    this.zone = data.zone || 'physics_town'
    this.difficulty = data.difficulty || 'basic'
    this.isGymBattle = data.is_gym_battle || false
    this.questionData = null
    this.answered = false
    this.selectedBtnIdx = 0
    this.buttons = []
  }

  create() {
    const { width, height } = this.scale
    this.add.image(width / 2, height / 2, 'battle_bg').setDisplaySize(width, height)
    this.add.rectangle(width / 2, height / 2, width, height, 0x05070d, 0.45)
    this.add.rectangle(width / 2, 86, 760, 108, 0x0b1020, 0.88).setStrokeStyle(3, 0x4b7bb8)
    this.add.rectangle(width / 2, 208, 760, 130, 0x0c1224, 0.9).setStrokeStyle(2, 0x5fa1f0)
    this.add.rectangle(width / 2, 545, 760, 40, 0x0b1020, 0.88).setStrokeStyle(2, 0x4b7bb8)
    this.enemyOrb = this.add.circle(width - 120, 90, 34, this.isGymBattle ? 0xffd166 : 0x99e2b4, 0.9).setStrokeStyle(3, 0xffffff)
    this.enemyOrbGlow = this.add.circle(width - 120, 90, 48, this.isGymBattle ? 0xffd166 : 0x99e2b4, 0.18)
    this.tweens.add({
      targets: [this.enemyOrb, this.enemyOrbGlow],
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
    const title = this.isGymBattle ? '⚡ GYM BATTLE ⚡' : '🌿 Wild Encounter!'
    this.add
      .text(width / 2, 40, title, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        color: this.isGymBattle ? '#ffd700' : '#90ee90',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
    this.add
      .text(120, 72, this.isGymBattle ? 'Gym Leader' : 'Wild Scholar', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#dbeafe',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
    this.add
      .text(120, 95, this.isGymBattle ? 'Difficulty: Intermediate' : 'Difficulty: Basic', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#a3c7f7',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
    this.loadingText = this.add
      .text(width / 2, height / 2, 'Loading question...', {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
    this.add
      .text(width / 2, height - 20, '← → ↑ ↓ to navigate · ENTER to confirm', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
    this.cameras.main.flash(220, 255, 255, 255)
    this.cameras.main.fadeIn(180, 0, 0, 0)
    this.fetchQuestionWithCycle()
  }

  renderQuestion(data) {
    const { width } = this.scale
    this.add
      .text(width / 2, 80, `[ ${data.subject} ]`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#d8e3ff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
    this.add
      .text(width / 2, 185, data.question_text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        color: '#ffffff',
        wordWrap: { width: 720, useAdvancedWrap: true },
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)

    const positions = [
      { x: 200, y: 360 },
      { x: 600, y: 360 },
      { x: 200, y: 450 },
      { x: 600, y: 450 },
    ]
    const labels = ['A', 'B', 'C', 'D']
    this.buttons = []
    data.options.forEach((optionText, idx) => {
      const pos = positions[idx]
      const bg = this.add
        .rectangle(pos.x, pos.y, 340, 60, 0x102846)
        .setInteractive({ cursor: 'pointer' })
        .setStrokeStyle(2, 0x4d93d8)
      this.add
        .text(pos.x - 145, pos.y, labels[idx], {
          fontFamily: 'Arial, sans-serif',
          fontSize: '30px',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
      const optText = this.add
        .text(pos.x + 15, pos.y, optionText, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          color: '#ffffff',
          wordWrap: { width: 280 },
          align: 'center',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
      bg.on('pointerover', () => {
        if (!this.answered) bg.setFillStyle(0x17406d)
      })
      bg.on('pointerout', () => {
        if (!this.answered) bg.setFillStyle(idx === this.selectedBtnIdx ? 0x17406d : 0x102846)
      })
      bg.on('pointerdown', () => {
        if (!this.answered) {
          this.answered = true
          this.submitAnswer(idx, bg)
        }
      })
      this.buttons.push({ bg, optText, idx })
    })

    this.highlightButton(this.selectedBtnIdx)
    this.input.keyboard.on('keydown-LEFT', () => this.navigateButtons(-1))
    this.input.keyboard.on('keydown-RIGHT', () => this.navigateButtons(1))
    this.input.keyboard.on('keydown-UP', () => this.navigateButtons(-2))
    this.input.keyboard.on('keydown-DOWN', () => this.navigateButtons(2))
    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.answered) {
        this.answered = true
        this.submitAnswer(this.selectedBtnIdx, this.buttons[this.selectedBtnIdx].bg)
      }
    })
  }

  navigateButtons(delta) {
    if (this.answered) return
    const newIdx = Math.max(0, Math.min(3, this.selectedBtnIdx + delta))
    this.buttons[this.selectedBtnIdx].bg.setFillStyle(0x102846).setStrokeStyle(2, 0x4d93d8)
    this.selectedBtnIdx = newIdx
    this.highlightButton(newIdx)
  }

  highlightButton(idx) {
    if (this.buttons[idx]) {
      this.buttons[idx].bg.setFillStyle(0x17406d).setStrokeStyle(3, 0x8fc7ff)
      this.tweens.add({ targets: this.buttons[idx].bg, scaleX: 1.03, scaleY: 1.03, yoyo: true, duration: 120 })
    }
  }

  submitAnswer(selectedIdx, buttonRef) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    const gameData = (this.game.config.gameData = this.game.config.gameData || {})
    let { playerId } = gameData
    const token = window.localStorage.getItem('academia_token')

    if (!playerId) {
      try {
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          playerId = payload?.player_id || null
          if (playerId) gameData.playerId = playerId
        }
      } catch {
        playerId = null
      }
    }

    if (!playerId) {
      this.showApiError('Session error: missing player ID. Re-login required.')
      this.time.delayedCall(1800, () => this.returnToWorld())
      return
    }

    fetch(`${apiBase}/battle/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        player_id: playerId,
        question_id: this.questionData.id,
        selected_idx: selectedIdx,
        is_gym_battle: this.isGymBattle,
      }),
    })
      .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))
      .then((result) => {
        if (!this.scene.isActive()) return
        if (result.status !== 200) {
          this.showApiError(result.body?.error || 'Battle evaluate failed')
          return
        }
        if (result.body.correct) this.onCorrectAnswer(result.body, buttonRef)
        else this.onWrongAnswer(buttonRef)
      })
      .catch(() => {
        if (!this.scene.isActive()) return
        this.showApiError('Network error. Returning...')
        this.time.delayedCall(2000, () => this.returnToWorld())
      })
  }

  onCorrectAnswer(result, buttonRef) {
    buttonRef.setFillStyle(0x22bb55).setStrokeStyle(3, 0x55ff88)
    this.cameras.main.flash(180, 130, 255, 130)
    this.add.circle(buttonRef.x, buttonRef.y, 26, 0x79f2a1, 0.45).setDepth(6)
    this.add
      .text(this.scale.width / 2, 270, `✓ CORRECT! +${result.exp_gained} EXP`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        color: '#55ff88',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
    if (result.explanation) {
      this.add
        .text(this.scale.width / 2, 300, result.explanation, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          color: '#aaaaaa',
          wordWrap: { width: 640 },
          align: 'center',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
    }
    const gameData = (this.game.config.gameData = this.game.config.gameData || {})
    const prevLevel = gameData.level || 1
    if (result.new_level > prevLevel) this.showLevelUpEffect(result.new_level)
    if (result.badge_earned) this.showBadgeEffect(result.badge_earned)
    gameData.exp = result.new_exp
    gameData.level = result.new_level
    window.dispatchEvent(
      new CustomEvent('academia:expUpdate', { detail: { exp: result.new_exp, level: result.new_level } }),
    )
    this.time.delayedCall(2500, () => this.returnToWorld(true))
  }

  onWrongAnswer(buttonRef) {
    buttonRef.setFillStyle(0xbb2222).setStrokeStyle(3, 0xff5555)
    this.cameras.main.shake(280, 0.02)
    this.cameras.main.flash(120, 255, 120, 120)
    this.add.circle(buttonRef.x, buttonRef.y, 24, 0xff6b6b, 0.38).setDepth(6)
    this.add
      .text(this.scale.width / 2, 270, `✗ WRONG! -${HP_DAMAGE} HP`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        color: '#ff5555',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
    const gameData = (this.game.config.gameData = this.game.config.gameData || {})
    const currentHp = gameData.hp ?? 100
    const newHp = Math.max(0, currentHp - HP_DAMAGE)
    gameData.hp = newHp
    window.dispatchEvent(new CustomEvent('academia:hpUpdate', { detail: { hp: newHp } }))
    this.time.delayedCall(2500, () => {
      if (newHp <= 0) this.showGameOver()
      else this.returnToWorld(true)
    })
  }

  showLevelUpEffect(newLevel) {
    const text = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 60, `LEVEL UP!\n▶ Lv.${newLevel}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '20px',
        color: '#ffd700',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0)
    this.tweens.add({
      targets: text,
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      yoyo: true,
      duration: 600,
      repeat: 1,
    })
  }

  showBadgeEffect(badgeName) {
    this.add.rectangle(this.scale.width / 2, 530, 500, 40, 0xffd700, 0.9)
    this.add
      .text(this.scale.width / 2, 530, `🏅 Badge Earned: ${badgeName}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '11px',
        color: '#000000',
      })
      .setOrigin(0.5)
  }

  showGameOver() {
    this.cameras.main.fade(600, 0, 0, 0)
    this.time.delayedCall(600, () => {
      this.cameras.main.resetFX()
      this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000)
      this.add
        .text(this.scale.width / 2, this.scale.height / 2 - 20, 'GAME OVER', {
          fontFamily: '"Press Start 2P"',
          fontSize: '28px',
          color: '#ff4444',
        })
        .setOrigin(0.5)
      this.add
        .text(this.scale.width / 2, this.scale.height / 2 + 30, 'Returning to world...', {
          fontFamily: '"Press Start 2P"',
          fontSize: '12px',
          color: '#aaaaaa',
        })
        .setOrigin(0.5)
      const gameData = (this.game.config.gameData = this.game.config.gameData || {})
      gameData.hp = 100
      window.dispatchEvent(new CustomEvent('academia:hpUpdate', { detail: { hp: 100 } }))
      this.time.delayedCall(3000, () => this.returnToWorld(true))
    })
  }

  returnToWorld(fromBattle = false) {
    window.dispatchEvent(
      new CustomEvent('academia:syncPosition', {
        detail: {
          map_x: (this.game.config.gameData || {}).map_x ?? 400,
          map_y: (this.game.config.gameData || {}).map_y ?? 300,
        },
      }),
    )
    this.scene.start('WorldScene', { fromBattle })
  }

  fetchQuestionWithCycle() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    const HISTORY_WINDOW = 10
    if (!apiBase) {
      this.showApiError('Missing API base URL configuration')
      this.time.delayedCall(1800, () => this.returnToWorld())
      return
    }

    const gameData = (this.game.config.gameData = this.game.config.gameData || {})
    gameData.zoneQuestionHistory = gameData.zoneQuestionHistory || {}
    const history = gameData.zoneQuestionHistory[this.zone] || []
    if (history.length >= HISTORY_WINDOW) gameData.zoneQuestionHistory[this.zone] = []

    let tries = 0
    const attempt = () => {
      tries += 1
      const controller = new AbortController()
      const timeoutId = this.time.delayedCall(8000, () => controller.abort())
      fetch(`${apiBase}/encounters?zone=${this.zone}&difficulty=${this.difficulty}`, {
        signal: controller.signal,
      })
        .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))
        .then((data) => {
          timeoutId.remove(false)
          if (!this.scene.isActive()) return
          if (data.status !== 200) {
            this.showApiError(data.body?.error || 'Question fetch failed')
            this.time.delayedCall(1500, () => this.returnToWorld())
            return
          }
          const question = data.body
          const used = gameData.zoneQuestionHistory[this.zone] || []
          if (used.includes(question.id) && tries < 12) {
            attempt()
            return
          }
          gameData.zoneQuestionHistory[this.zone] = [...used, question.id].slice(-HISTORY_WINDOW)
          this.questionData = question
          this.loadingText.destroy()
          this.renderQuestion(question)
        })
        .catch(() => {
          timeoutId.remove(false)
          if (!this.scene.isActive()) return
          this.showApiError('Question request timed out. Returning...')
          this.time.delayedCall(2000, () => this.returnToWorld())
        })
    }
    attempt()
  }

  showApiError(message) {
    this.add.rectangle(this.scale.width / 2, 300, 720, 58, 0x5b1010, 0.95).setStrokeStyle(3, 0xff8a8a).setDepth(30)
    this.add
      .text(this.scale.width / 2, 300, message, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(31)
  }
}
