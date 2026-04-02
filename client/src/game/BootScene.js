export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const { width, height } = this.scale
    const barW = 320
    const barH = 20
    const barX = (width - barW) / 2
    const barY = height / 2

    const bgBar = this.add.graphics()
    const fillBar = this.add.graphics()
    const loadText = this.add
      .text(width / 2, barY - 30, 'Loading...', {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    bgBar.fillStyle(0x222222).fillRect(barX, barY, barW, barH)
    bgBar.lineStyle(2, 0x4488cc).strokeRect(barX, barY, barW, barH)

    this.load.on('progress', (value) => {
      fillBar.clear()
      fillBar.fillStyle(0x22bb55).fillRect(barX + 2, barY + 2, (barW - 4) * value, barH - 4)
    })
    let completed = false
    this.load.on('complete', () => {
      completed = true
      loadText.setText('Ready!')
    })

    this.load.on('loaderror', () => {
      if (completed) return
      loadText.setText('Asset load failed')
      this.add
        .text(width / 2, barY + 34, 'Press R to retry', {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          color: '#ff9f9f',
        })
        .setOrigin(0.5)
      this.input.keyboard.once('keydown-R', () => this.scene.restart())
    })

    this.time.delayedCall(12000, () => {
      if (completed) return
      loadText.setText('Loading timeout')
      this.add
        .text(width / 2, barY + 34, 'Check server/assets, then press R', {
          fontFamily: '"Press Start 2P"',
          fontSize: '9px',
          color: '#ff9f9f',
        })
        .setOrigin(0.5)
      this.input.keyboard.once('keydown-R', () => this.scene.restart())
    })

    this.load.tilemapTiledJSON('world', '/assets/tilemaps/world.json')
    this.load.image('tileset', '/assets/tilesets/tileset.png')
    this.load.spritesheet('player', '/assets/sprites/player.png', { frameWidth: 16, frameHeight: 16 })
    this.load.image('battle_bg', '/assets/ui/battle_bg.png')
  }

  create() {
    this.scene.start('WorldScene')
  }
}
