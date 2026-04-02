'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { loginPlayer } from '../lib/api'

export default function LoginForm() {
  const router = useRouter()
  const { setPlayerData } = usePlayer()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await loginPlayer(username, password)
      localStorage.setItem('academia_token', data.token)
      setPlayerData({
        playerId: data.player.id,
        username: data.player.username,
        level: data.player.level,
        exp: data.player.exp,
        hp: data.player.hp,
        maxHp: data.player.max_hp,
        mapX: data.player.map_x,
        mapY: data.player.map_y,
        token: data.token,
      })
      router.push('/select-region')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="academy-panel w-full max-w-md p-6 rounded">
        <h1 className="academy-title text-xl mb-6 text-center">Play Academia</h1>
        <input
          className="w-full mb-3 p-2 bg-slate-950 text-slate-100 border border-sky-700"
          type="text"
          minLength={3}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          className="w-full mb-3 p-2 bg-slate-950 text-slate-100 border border-sky-700"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button
          className="academy-btn-primary w-full p-2 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
        {error ? <p className="text-red-300 mt-3 text-xs">{error}</p> : null}
        <p className="mt-4 text-xs">
          <Link href="/register" className="underline">
            No account? Register
          </Link>
        </p>
      </form>
    </div>
  )
}
