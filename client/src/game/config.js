import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants'

const phaserType = typeof window === 'undefined' ? 0 : window.Phaser?.AUTO

const config = {
  type: phaserType,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: 'phaser-container',
  pixelArt: true,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [],
  gameData: {},
}

export default config
