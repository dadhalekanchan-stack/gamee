'use client'

import { PlayerProvider } from '../context/PlayerContext'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

export default function Providers({ children }) {
  return (
    <PlayerProvider>
      <ServiceWorkerRegister />
      {children}
    </PlayerProvider>
  )
}
