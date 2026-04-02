'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { registerPlayer } from '../lib/api'

export default function RegisterForm() {
  const router = useRouter()
  const { setPlayerData } = usePlayer()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    try {
      const data = await registerPlayer(username, password)
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
      setSuccess('Registration successful! Redirecting...')
      setTimeout(() => router.push('/select-region'), 800)
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
        <input
          className="w-full mb-3 p-2 bg-slate-950 text-slate-100 border border-sky-700"
          type="password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          required
        />
        <button
          className="academy-btn-primary w-full p-2 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Register'}
        </button>
        {error ? <p className="text-red-300 mt-3 text-xs">{error}</p> : null}
        {success ? <p className="text-amber-200 mt-3 text-xs">{success}</p> : null}
        <p className="mt-4 text-xs">
          <Link href="/login" className="underline">
            Already have an account? Login
          </Link>
        </p>
      </form>
    </div>
  )
}
