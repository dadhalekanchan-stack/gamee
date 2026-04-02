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
      className="absolute top-14 left-3 z-10 p-3 text-[12px] leading-5 text-white rounded"
      style={{ background: 'rgba(7,10,18,0.78)', border: '2px solid #8ec5ff', width: 300, boxShadow: '0 0 0 2px #1f2e4a inset', fontFamily: 'Arial, sans-serif' }}
    >
      <div className="mb-1 text-[12px] text-blue-100">ACADEMIA HUD</div>
      <div>❤ HP</div>
      <div className="w-full h-3 bg-gray-700 mb-1">
        <div className="h-3 bg-red-500" style={{ width: `${hpPct}%` }} />
      </div>
      <div className="mb-2">{hp}/{maxHp}</div>
      <div>⭐ EXP</div>
      <div className="w-full h-3 bg-gray-700 mb-1">
        <div className="h-3 bg-yellow-400" style={{ width: `${expPct}%` }} />
      </div>
      <div className="mb-2">{Number.isFinite(threshold) ? `${exp}/${threshold}` : 'MAX LEVEL'}</div>
      <div>LVL {level} | {zone}</div>
      <div className="mt-2 text-[10px] text-blue-100">Pause: Esc | Toggle HUD: H</div>
      {paused ? <div className="mt-1 text-[11px] text-yellow-300">PAUSED</div> : null}
    </div>
  )
}
