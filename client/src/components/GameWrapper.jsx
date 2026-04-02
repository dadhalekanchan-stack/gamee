'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { syncPosition } from '../lib/api'
import HUD from './HUD'

export default function GameWrapper({ onClose }) {
  const gameRef = useRef(null)
  const shellRef = useRef(null)
  const { playerId, level, exp, hp, mapX, mapY, updateExpAndLevel, updateHp } = usePlayer()
  const lastPosRef = useRef({ map_x: mapX ?? 400, map_y: mapY ?? 300 })
  const [currentZone, setCurrentZone] = useState('Physics Town')
  const [isPaused, setIsPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHud, setShowHud] = useState(false)

  useEffect(() => {
    if (gameRef.current) return
    if (!playerId) return
    let mounted = true
    let onExpUpdate
    let onHpUpdate
    let onSyncPos
    let onZoneChange
    let onPauseToggle

    ;(async () => {
      const Phaser = (await import('phaser')).default
      window.Phaser = Phaser
      const { default: config } = await import('../game/config')
      const { BootScene } = await import('../game/BootScene')
      const { WorldScene } = await import('../game/WorldScene')
      const { BattleScene } = await import('../game/BattleScene')
      if (!mounted) return

      config.scene = [BootScene, WorldScene, BattleScene]
      config.scale = {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: config.width,
        height: config.height,
      }
      config.gameData = {
        playerId,
        level,
        exp,
        hp,
        map_x: mapX ?? 400,
        map_y: mapY ?? 300,
        zone: 'physics_town',
      }

      gameRef.current = new Phaser.Game(config)

      onExpUpdate = (e) => updateExpAndLevel(e.detail.exp, e.detail.level)
      onHpUpdate = (e) => updateHp(e.detail.hp)
      onSyncPos = (e) => {
        lastPosRef.current = { map_x: e.detail.map_x, map_y: e.detail.map_y }
        if (playerId) {
          syncPosition(playerId, e.detail.map_x, e.detail.map_y).catch(() => {})
        }
      }
      onZoneChange = (e) => setCurrentZone(e.detail.zone)
      onPauseToggle = (e) => setIsPaused(Boolean(e.detail?.paused))

      window.addEventListener('academia:expUpdate', onExpUpdate)
      window.addEventListener('academia:hpUpdate', onHpUpdate)
      window.addEventListener('academia:syncPosition', onSyncPos)
      window.addEventListener('academia:zoneChange', onZoneChange)
      window.addEventListener('academia:pauseToggle', onPauseToggle)
    })()

    return () => {
      mounted = false
      if (onExpUpdate) window.removeEventListener('academia:expUpdate', onExpUpdate)
      if (onHpUpdate) window.removeEventListener('academia:hpUpdate', onHpUpdate)
      if (onSyncPos) window.removeEventListener('academia:syncPosition', onSyncPos)
      if (onZoneChange) window.removeEventListener('academia:zoneChange', onZoneChange)
      if (onPauseToggle) window.removeEventListener('academia:pauseToggle', onPauseToggle)
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
      if (playerId) {
        syncPosition(playerId, lastPosRef.current.map_x, lastPosRef.current.map_y).catch(() => {})
      }
    }
  }, [playerId, level, exp, hp, mapX, mapY, updateExpAndLevel, updateHp])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    const onKeyDown = (e) => {
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
        else shellRef.current?.requestFullscreen?.().catch(() => {})
      }
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setShowHud((prev) => !prev)
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (isPaused) setShowHud(true)
  }, [isPaused])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else shellRef.current?.requestFullscreen?.().catch(() => {})
  }

  return (
    <div ref={shellRef} className="relative w-screen h-screen overflow-hidden bg-black">
      <div id="phaser-container" className="w-screen h-screen" />
      {showHud ? <HUD zone={currentZone} paused={isPaused} /> : null}
      <button
        className="absolute top-3 left-3 z-20 px-3 py-2 text-[10px] text-white bg-black/70 border border-cyan-300"
        onClick={() => setShowHud((prev) => !prev)}
      >
        {showHud ? 'Hide HUD (H)' : 'Show HUD (H)'}
      </button>
      <button className="absolute top-3 right-3 z-20 px-3 py-2 text-[10px] text-white bg-black/70 border border-blue-400" onClick={toggleFullscreen}>
        {isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
      </button>
      {onClose ? (
        <button className="absolute top-3 right-44 z-20 px-3 py-2 text-[10px] text-white bg-black/70 border border-red-400" onClick={onClose}>
          Exit Game
        </button>
      ) : null}
    </div>
  )
}
