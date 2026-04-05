'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBadges } from '../lib/api'
import { usePlayer } from '../hooks/usePlayer'
import { LEVEL_THRESHOLDS } from '../game/constants'
import GameWrapper from './GameWrapper'
import BackButton from './BackButton'

export default function Dashboard() {
  const router = useRouter()
  const { playerId, username, level, exp, hp, maxHp, selectedStandard, selectedRegion, selectedStream, logout } = usePlayer()
  const [badges, setBadges] = useState([])
  const [showGame, setShowGame] = useState(false)

  useEffect(() => {
    let active = true
    if (!playerId) return
    getBadges(playerId)
      .then((data) => {
        if (active) setBadges(data.badges || [])
      })
      .catch(() => {
        if (active) setBadges([])
      })
    return () => {
      active = false
    }
  }, [playerId])

  const threshold = useMemo(() => LEVEL_THRESHOLDS[level] ?? Infinity, [level])
  const expPct = Number.isFinite(threshold) ? Math.max(0, Math.min(100, (exp / threshold) * 100)) : 100

  return (
    <div className="min-h-screen text-slate-100 bg-[radial-gradient(circle_at_20%_20%,#26438e_0%,#132c6b_35%,#081433_70%,#050b1c_100%)]">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-4">
          <BackButton fallback="/" label="Home" />
        </div>
        <div className="rounded-xl border border-sky-500/60 bg-slate-950/45 backdrop-blur-sm p-6 md:p-8 shadow-[0_0_0_2px_rgba(125,211,252,0.15)_inset]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="academy-title text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Arial, sans-serif' }}>Welcome, {username}!</h1>
              <p className="text-base md:text-lg text-sky-100" style={{ fontFamily: 'Arial, sans-serif' }}>
                {selectedStandard} · {selectedRegion} · {selectedStream || 'PCM'}
              </p>
            </div>
            <div className="text-sm text-sky-100/90" style={{ fontFamily: 'Arial, sans-serif' }}>
              Academia Command Deck
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-lg border border-sky-700/70 bg-slate-900/70 p-5">
              <p className="mb-2 text-amber-100 text-xl" style={{ fontFamily: 'Arial, sans-serif' }}>LVL {level}</p>
              <div className="w-full h-6 bg-slate-800 mb-2 border border-sky-700">
                <div className="h-6 bg-gradient-to-r from-amber-300 to-yellow-500" style={{ width: `${expPct}%` }} />
              </div>
              <p className="text-base mb-3 text-slate-100" style={{ fontFamily: 'Arial, sans-serif' }}>
                {level === 10 ? 'MAX LEVEL' : `${exp} / ${threshold} EXP`}
              </p>
              <p className="text-lg text-red-100" style={{ fontFamily: 'Arial, sans-serif' }}>{hp} / {maxHp} HP</p>
            </section>

            <section className="rounded-lg border border-amber-500/50 bg-slate-900/70 p-5">
              <h2 className="mb-3 text-2xl text-amber-100" style={{ fontFamily: 'Arial, sans-serif' }}>Badges</h2>
              {badges.length === 0 ? (
                <p className="text-base text-slate-100" style={{ fontFamily: 'Arial, sans-serif' }}>No badges yet — challenge a Gym!</p>
              ) : (
                <ul className="text-base space-y-2 text-slate-100" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {badges.map((badge) => (
                    <li key={`${badge.badge_name}-${badge.earned_at}`}>
                      {badge.zone} — {new Date(badge.earned_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              className="academy-btn-primary px-8 py-4 text-2xl disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Arial, sans-serif' }}
              onClick={() => setShowGame(true)}
              disabled={!playerId}
              title={!playerId ? 'Loading player profile...' : 'Start game'}
            >
              ▶ PLAY
            </button>
            <button
              className="academy-btn-secondary px-6 py-4 text-2xl"
              style={{ fontFamily: 'Arial, sans-serif' }}
              onClick={() => router.push('/tutorial?from=dashboard')}
            >
              Help / Tutorial
            </button>
            <button
              className="academy-btn-secondary px-6 py-4 text-2xl"
              style={{ fontFamily: 'Arial, sans-serif' }}
              onClick={() => {
                logout()
                router.push('/login')
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {showGame ? <GameWrapper onClose={() => setShowGame(false)} /> : null}
    </div>
  )
}
