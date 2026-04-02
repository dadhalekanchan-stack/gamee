'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getPlayer } from '../lib/api'

export const PlayerContext = createContext(null)

const initialState = {
  playerId: null,
  username: '',
  level: 1,
  exp: 0,
  hp: 100,
  maxHp: 100,
  mapX: 400,
  mapY: 300,
  selectedStandard: null,
  selectedRegion: null,
  selectedStream: null,
  token: null,
  isLoaded: false,
}

export function PlayerProvider({ children }) {
  const [state, setState] = useState(initialState)

  const setPlayerData = useCallback((data) => {
    setState((prev) => ({
      ...prev,
      playerId: data.playerId ?? data.id ?? prev.playerId,
      username: data.username ?? prev.username,
      level: data.level ?? prev.level,
      exp: data.exp ?? prev.exp,
      hp: data.hp ?? prev.hp,
      maxHp: data.maxHp ?? data.max_hp ?? prev.maxHp,
      mapX: data.mapX ?? data.map_x ?? prev.mapX,
      mapY: data.mapY ?? data.map_y ?? prev.mapY,
      selectedStandard: data.selectedStandard ?? prev.selectedStandard,
      selectedRegion: data.selectedRegion ?? prev.selectedRegion,
      selectedStream: data.selectedStream ?? prev.selectedStream,
      token: data.token ?? prev.token,
    }))
  }, [])

  const updateHp = useCallback((newHp) => {
    setState((prev) => ({ ...prev, hp: newHp }))
  }, [])

  const updateExpAndLevel = useCallback((exp, level) => {
    setState((prev) => ({ ...prev, exp, level }))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('academia_token')
    localStorage.removeItem('academia_region')
    setState({ ...initialState, isLoaded: true })
  }, [])

  const setAcademicRegion = useCallback(({ selectedStandard, selectedRegion, selectedStream }) => {
    setState((prev) => ({ ...prev, selectedStandard, selectedRegion, selectedStream }))
  }, [])

  useEffect(() => {
    let active = true

    const rehydrate = async () => {
      const token = localStorage.getItem('academia_token')
      const savedRegion = localStorage.getItem('academia_region')
      let regionData = null
      if (savedRegion) {
        try {
          regionData = JSON.parse(savedRegion)
        } catch {
          regionData = null
        }
      }
      if (!token) {
        if (active) setState((prev) => ({ ...prev, isLoaded: true }))
        return
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const player = await getPlayer(payload.player_id)
        if (!active) return
        setState({
          playerId: player.id,
          username: player.username,
          level: player.level,
          exp: player.exp,
          hp: player.hp,
          maxHp: player.max_hp,
          mapX: player.map_x,
          mapY: player.map_y,
          selectedStandard: regionData?.selectedStandard ?? null,
          selectedRegion: regionData?.selectedRegion ?? null,
          selectedStream: regionData?.selectedStream ?? null,
          token,
          isLoaded: true,
        })
      } catch (err) {
        if (!active) return
        localStorage.removeItem('academia_token')
        window.location.href = '/login'
        setState((prev) => ({ ...initialState, isLoaded: true }))
      }
    }

    rehydrate()
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({
      ...state,
        setPlayerData,
        updateHp,
        updateExpAndLevel,
        setAcademicRegion,
        logout,
      }),
    [state, setPlayerData, updateHp, updateExpAndLevel, setAcademicRegion, logout],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
