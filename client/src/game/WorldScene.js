import {
  PLAYER_SPEED,
  GRASS_ENCOUNTER_CHANCE,
  BATTLE_COOLDOWN_MS,
  GYM_LEVEL_REQUIREMENT,
  ZONE_LABELS,
} from './constants'

export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' })
  }

  init(data) {
    this.returnData = data || {}
    this.gymTransitioning = false
    this.gymCooldown = false
    this.activeGymZone = null
    this.activeGymSeenAt = 0
    this.grassCooldown = false
    this.lastSyncAt = 0
    this.zoneBroadcastAt = 0
    this.isPaused = false
    this.pauseContainer = null
    this.pauseButtons = []
    this.pauseSelection = 0
  }

  create() {
    const gameData = (this.game.config.gameData = this.game.config.gameData || {})
    const map = this.make.tilemap({ key: 'world' })
    const tileset = map.addTilesetImage('tileset', 'tileset')

    this.groundLayer = map.createLayer('Ground', tileset, 0, 0)
    this.obstacleLayer = map.createLayer('Obstacles', tileset, 0, 0)
    this.tallGrassLayer = map.createLayer('TallGrass', tileset, 0, 0)
    this.obstacleLayer.setCollisionByProperty({ collides: true })

    const startX = gameData.map_x ?? 400
    const startY = gameData.map_y ?? 300
    this.player = this.physics.add.sprite(startX, startY, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(3)
    this.player.setScale(2.2)

    const animDefs = [
      { key: 'walk-down', frames: [0, 1, 2] },
      { key: 'walk-left', frames: [3, 4, 5] },
      { key: 'walk-right', frames: [6, 7, 8] },
      { key: 'walk-up', frames: [9, 10, 11] },
      { key: 'idle', frames: [0] },
    ]
    animDefs.forEach(({ key, frames }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: frames.map((f) => ({ key: 'player', frame: f })),
          frameRate: key === 'idle' ? 1 : 8,
          repeat: -1,
        })
      }
    })

    this.physics.add.collider(this.player, this.obstacleLayer)
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.zoneBands = this.buildZoneBands(map.widthInPixels)
    this.createWorldDecor(map)

    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.pauseKey.on('down', () => this.togglePauseMenu())

    const gymTriggerY = Math.min(map.heightInPixels - 110, 320)
    this.gymZones = this.zoneBands.map((band) => {
      const gym = this.add.zone(Math.round((band.minX + band.maxX) / 2), gymTriggerY, 120, 120)
      this.physics.world.enable(gym, Phaser.Physics.Arcade.STATIC_BODY)
      this.physics.add.overlap(
        this.player,
        gym,
        () => {
          this.activeGymZone = band.zone
          this.activeGymSeenAt = this.time.now
        },
        null,
        this,
      )
      return gym
    })
    this.currentZone = this.getZoneByX(this.player.x)
    gameData.zone = this.currentZone

    if (this.returnData.fromBattle) {
      this.grassCooldown = true
      this.gymCooldown = true
      this.time.delayedCall(BATTLE_COOLDOWN_MS, () => {
        this.grassCooldown = false
        this.gymCooldown = false
      })
    }

    window.dispatchEvent(
      new CustomEvent('academia:zoneChange', {
        detail: { zone: ZONE_LABELS[this.currentZone] || this.currentZone },
      }),
    )
  }

  update() {
    if (this.isPaused) return
    if (this.activeGymZone && this.time.now - this.activeGymSeenAt > 120) {
      this.activeGymZone = null
    }
    this.player.setVelocity(0)
    const left = this.cursors.left.isDown || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up = this.cursors.up.isDown || this.wasd.up.isDown
    const down = this.cursors.down.isDown || this.wasd.down.isDown

    let moving = false
    let animKey = 'idle'
    if (left) {
      this.player.setVelocityX(-PLAYER_SPEED)
      animKey = 'walk-left'
      moving = true
    } else if (right) {
      this.player.setVelocityX(PLAYER_SPEED)
      animKey = 'walk-right'
      moving = true
    }
    if (up) {
      this.player.setVelocityY(-PLAYER_SPEED)
      animKey = 'walk-up'
      moving = true
    } else if (down) {
      this.player.setVelocityY(PLAYER_SPEED)
      animKey = 'walk-down'
      moving = true
    }
    if (moving) this.player.body.velocity.normalize().scale(PLAYER_SPEED)
    this.player.anims.play(animKey, true)

    const now = this.time.now
    if (now - this.lastSyncAt >= 5000) {
      this.lastSyncAt = now
      this.game.config.gameData.map_x = Math.round(this.player.x)
      this.game.config.gameData.map_y = Math.round(this.player.y)
      window.dispatchEvent(
        new CustomEvent('academia:syncPosition', {
          detail: {
            map_x: this.game.config.gameData.map_x,
            map_y: this.game.config.gameData.map_y,
          },
        }),
      )
    }

    if (moving && !this.grassCooldown) {
      this.syncZoneByPosition()
      const tile = this.tallGrassLayer.getTileAtWorldXY(this.player.x, this.player.y)
      if (tile && Math.random() < GRASS_ENCOUNTER_CHANCE) {
        this.grassCooldown = true
        this.game.config.gameData.map_x = Math.round(this.player.x)
        this.game.config.gameData.map_y = Math.round(this.player.y)
        this.scene.start('BattleScene', {
          zone: this.currentZone,
          difficulty: 'basic',
          is_gym_battle: false,
        })
      }
    }

    if (this.activeGymZone && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this._onGymOverlap(this.activeGymZone)
    }

    this.syncZoneByPosition()
  }

  _onGymOverlap(zone) {
    if (this.gymCooldown || this.gymTransitioning) return
    this.currentZone = zone
    this.game.config.gameData.zone = zone
    const level = this.game.config.gameData.level || 1
    const required = GYM_LEVEL_REQUIREMENT[this.currentZone] || 3
    if (level < required) {
      this.showFloatingText(this.player.x, this.player.y - 30, `Need Level ${required}!`, '#ff4444')
    } else {
      this.gymTransitioning = true
      this.gymCooldown = true
      this.game.config.gameData.map_x = Math.round(this.player.x)
      this.game.config.gameData.map_y = Math.round(this.player.y)
      this.scene.start('BattleScene', {
        zone: this.currentZone,
        difficulty: 'intermediate',
        is_gym_battle: true,
      })
    }
  }

  showFloatingText(x, y, message, color = '#ffffff') {
    const text = this.add
      .text(x, y, message, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        color,
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10)
    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 1500,
      ease: 'Power1',
      onComplete: () => text.destroy(),
    })
  }

  togglePauseMenu() {
    this.isPaused = !this.isPaused
    window.dispatchEvent(new CustomEvent('academia:pauseToggle', { detail: { paused: this.isPaused } }))
    if (this.isPaused) this.openPauseMenu()
    else this.closePauseMenu()
  }

  openPauseMenu() {
    if (this.pauseContainer) return
    const { width, height } = this.scale
    const container = this.add.container(0, 0).setDepth(50)
    const panel = this.add.rectangle(width - 220, height / 2, 420, 330, 0x101a2a, 0.95).setStrokeStyle(3, 0x7bb2ff)
    const title = this.add
      .text(width - 220, height / 2 - 126, 'PAUSE MENU', {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        color: '#d9ebff',
      })
      .setOrigin(0.5)

    const subTitle = this.add
      .text(width - 220, height / 2 - 98, 'Choose an option', {
        fontFamily: '"Press Start 2P"',
        fontSize: '9px',
        color: '#ffe58a',
      })
      .setOrigin(0.5)

    const keyLines = [
      'Move: Arrow Keys or W A S D',
      'Enter Gym: E (when standing on gym)',
      'Confirm in Battle: ENTER',
      'Battle Selection: Arrow Keys',
      'Pause Menu: ESC',
      'Fullscreen Toggle: F',
      'HUD Toggle: H',
      'Resume Game: ESC',
    ]

    const detailText = this.add
      .text(width - 220, height / 2 + 88, keyLines.join('\n'), {
        fontFamily: '"Press Start 2P"',
        fontSize: '9px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5)

    const actions = [
      {
        label: 'Key Bindings',
        onSelect: () => {
          detailText.setText(keyLines.join('\n'))
        },
      },
      {
        label: 'Help / Tutorial',
        onSelect: () => {
          this.isPaused = false
          this.closePauseMenu()
          window.dispatchEvent(new CustomEvent('academia:pauseToggle', { detail: { paused: false } }))
          window.dispatchEvent(new CustomEvent('academia:pauseAction', { detail: { action: 'tutorial' } }))
        },
      },
      {
        label: 'Select Class Again',
        onSelect: () => {
          this.isPaused = false
          this.closePauseMenu()
          window.dispatchEvent(new CustomEvent('academia:pauseToggle', { detail: { paused: false } }))
          window.dispatchEvent(new CustomEvent('academia:pauseAction', { detail: { action: 'selectClass' } }))
        },
      },
    ]

    this.pauseButtons = actions.map((action, idx) => {
      const y = height / 2 - 52 + idx * 42
      const bg = this.add
        .rectangle(width - 220, y, 270, 34, 0x173456, 0.92)
        .setStrokeStyle(2, 0x7bb2ff)
        .setInteractive({ cursor: 'pointer' })
      const label = this.add
        .text(width - 220, y, action.label, {
          fontFamily: '"Press Start 2P"',
          fontSize: '9px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
      bg.on('pointerdown', action.onSelect)
      bg.on('pointerover', () => this.highlightPauseSelection(idx))
      return { bg, label, onSelect: action.onSelect }
    })

    this.pauseSelection = 0
    this.highlightPauseSelection(0)

    this.onPauseUp = () => this.highlightPauseSelection(Math.max(0, this.pauseSelection - 1))
    this.onPauseDown = () => this.highlightPauseSelection(Math.min(this.pauseButtons.length - 1, this.pauseSelection + 1))
    this.onPauseEnter = () => {
      const item = this.pauseButtons[this.pauseSelection]
      if (item) item.onSelect()
    }

    this.input.keyboard.on('keydown-UP', this.onPauseUp)
    this.input.keyboard.on('keydown-DOWN', this.onPauseDown)
    this.input.keyboard.on('keydown-ENTER', this.onPauseEnter)

    const footer = this.add
      .text(width - 220, height / 2 + 146, 'Press ESC to continue', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#8bb6e0',
      })
      .setOrigin(0.5)
    container.add([panel, title, subTitle, detailText, footer, ...this.pauseButtons.flatMap((b) => [b.bg, b.label])])
    this.pauseContainer = container
  }

  highlightPauseSelection(idx) {
    this.pauseSelection = idx
    this.pauseButtons.forEach((btn, i) => {
      if (i === idx) {
        btn.bg.setFillStyle(0x1f4ea6).setStrokeStyle(2, 0x9ed0ff)
      } else {
        btn.bg.setFillStyle(0x173456).setStrokeStyle(2, 0x7bb2ff)
      }
    })
  }

  closePauseMenu() {
    if (this.onPauseUp) this.input.keyboard.off('keydown-UP', this.onPauseUp)
    if (this.onPauseDown) this.input.keyboard.off('keydown-DOWN', this.onPauseDown)
    if (this.onPauseEnter) this.input.keyboard.off('keydown-ENTER', this.onPauseEnter)
    this.onPauseUp = null
    this.onPauseDown = null
    this.onPauseEnter = null
    this.pauseButtons = []
    if (this.pauseContainer) {
      this.pauseContainer.destroy(true)
      this.pauseContainer = null
    }
  }

  buildZoneBands(worldWidth) {
    const step = worldWidth / 3
    return [
      { zone: 'physics_town', minX: 0, maxX: step },
      { zone: 'math_town', minX: step, maxX: step * 2 },
      { zone: 'chem_town', minX: step * 2, maxX: worldWidth },
    ]
  }

  createWorldDecor(map) {
    const worldHeight = map.heightInPixels
    const zoneColors = {
      physics_town: 0x60a5fa,
      math_town: 0x34d399,
      chem_town: 0xfbbf24,
    }

    this.zoneBands.forEach((band) => {
      const zoneWidth = band.maxX - band.minX
      this.add
        .rectangle(band.minX + zoneWidth / 2, worldHeight / 2, zoneWidth, worldHeight, zoneColors[band.zone], 0.08)
        .setDepth(0.2)
      this.add
        .rectangle(band.maxX - 2, worldHeight / 2, 4, worldHeight, 0xffffff, 0.12)
        .setDepth(0.25)
    })

    this.add.rectangle(map.widthInPixels / 2, map.heightInPixels / 2, map.widthInPixels, 20, 0xe5d08a, 0.35).setDepth(0.3)
    this.add.rectangle(map.widthInPixels / 2, map.heightInPixels / 2 + 100, map.widthInPixels, 14, 0xd6be75, 0.28).setDepth(0.3)

    const landmarks = [
      { x: 140, y: 140, label: 'Physics Lab' },
      { x: 390, y: 130, label: 'Math Arena' },
      { x: 640, y: 140, label: 'Chem Works' },
      { x: 240, y: 480, label: 'Training Deck' },
      { x: 520, y: 470, label: 'Academia Gate' },
    ]

    landmarks.forEach((l) => {
      this.add.rectangle(l.x, l.y, 86, 56, 0x1f2937, 0.95).setStrokeStyle(3, 0x93c5fd).setDepth(0.8)
      this.add
        .text(l.x, l.y + 36, l.label, {
          fontFamily: '"Press Start 2P"',
          fontSize: '12px',
          color: '#ffffff',
          stroke: '#0b1220',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(0.9)
    })

    const signs = [
      { x: 80, y: 300, text: 'Region A-B: Physics' },
      { x: 380, y: 300, text: 'Region C-E: Mathematics' },
      { x: 680, y: 300, text: 'Region F-G: Chemistry' },
    ]
    signs.forEach((s) => {
      this.add.rectangle(s.x, s.y, 170, 34, 0x3b2f1d, 0.95).setStrokeStyle(3, 0xd4a373).setDepth(1.5)
      this.add
        .text(s.x, s.y, s.text, {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          color: '#ffffff',
          stroke: '#2a2010',
          strokeThickness: 3,
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(1.6)
    })

    const npcs = [
      { x: 170, y: 230, color: 0x38bdf8, name: 'Tutor P' },
      { x: 330, y: 420, color: 0x22c55e, name: 'Guide M' },
      { x: 610, y: 240, color: 0xf97316, name: 'Mentor C' },
      { x: 520, y: 360, color: 0xa78bfa, name: 'Scholar' },
    ]
    npcs.forEach((npc) => {
      const body = this.add.rectangle(npc.x, npc.y, 16, 22, npc.color, 1).setStrokeStyle(2, 0x0f172a).setDepth(1.8)
      this.add.ellipse(npc.x, npc.y + 12, 18, 7, 0x000000, 0.35).setDepth(1.7)
      this.add
        .text(npc.x, npc.y - 14, npc.name, {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          color: '#ffffff',
          stroke: '#0b1220',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(1.9)
      this.tweens.add({
        targets: body,
        y: npc.y - 2,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })
  }

  getZoneByX(x) {
    const band = this.zoneBands.find((b) => x >= b.minX && x < b.maxX)
    return band?.zone || 'physics_town'
  }

  syncZoneByPosition() {
    const zone = this.getZoneByX(this.player.x)
    if (zone !== this.currentZone) {
      this.currentZone = zone
      this.game.config.gameData.zone = zone
      window.dispatchEvent(
        new CustomEvent('academia:zoneChange', {
          detail: { zone: ZONE_LABELS[this.currentZone] || this.currentZone },
        }),
      )
    }
  }
}
