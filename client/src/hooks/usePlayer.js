import { useContext } from 'react'
import { PlayerContext } from '../context/PlayerContext'

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside a PlayerProvider')
  return ctx
}
