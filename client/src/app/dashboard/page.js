'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Providers from '../providers'
import Dashboard from '../../components/Dashboard'
import { usePlayer } from '../../hooks/usePlayer'

function DashboardBody() {
  const router = useRouter()
  const { token, isLoaded, selectedStandard } = usePlayer()

  useEffect(() => {
    if (!isLoaded) return
    if (!token) router.replace('/login')
    else if (!selectedStandard) router.replace('/select-region')
  }, [token, isLoaded, selectedStandard, router])

  if (!isLoaded) return null
  if (!token) return null
  if (!selectedStandard) return null
  return <Dashboard />
}

export default function DashboardPage() {
  return (
    <Providers>
      <DashboardBody />
    </Providers>
  )
}
