'use client'

import { usePlayer } from '../hooks/usePlayer'
import { LEVEL_THRESHOLDS } from '../game/constants'

export default function HUD({ zone, paused }) {
  const { hp, maxHp, exp, level } = usePlayer()
  const threshold = LEVEL_THRESHOLDS[level] ?? Infinity
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const expPct = Number.isFinite(threshold) ? Math.max(0, Math.min(100, (exp / threshold) * 100)) : 100

  return (
    <div
      className="absolute top-3 left-3 z-10 p-4 text-[14px] leading-6 text-white"
      style={{ background: 'rgba(7,10,18,0.94)', border: '3px solid #8ec5ff', width: 420, boxShadow: '0 0 0 3px #1f2e4a inset', fontFamily: 'Arial, sans-serif' }}
    >
      <div className="mb-2 text-[14px] text-blue-100">ACADEMIA HUD</div>
      <div>❤ HP</div>
      <div className="w-full h-4 bg-gray-700 mb-1">
        <div className="h-4 bg-red-500" style={{ width: `${hpPct}%` }} />
      </div>
      <div className="mb-2">{hp}/{maxHp}</div>
      <div>⭐ EXP</div>
      <div className="w-full h-4 bg-gray-700 mb-1">
        <div className="h-4 bg-yellow-400" style={{ width: `${expPct}%` }} />
      </div>
      <div className="mb-2">{Number.isFinite(threshold) ? `${exp}/${threshold}` : 'MAX LEVEL'}</div>
      <div>LVL {level} | {zone}</div>
      <div className="mt-2 text-[12px] text-blue-100">Pause: Esc | Key Guide: inside Pause Menu</div>
      {paused ? <div className="mt-1 text-[13px] text-yellow-300">PAUSED</div> : null}
    </div>
  )
}
