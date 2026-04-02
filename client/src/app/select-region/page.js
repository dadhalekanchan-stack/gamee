'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Providers from '../providers'
import { usePlayer } from '../../hooks/usePlayer'

const STANDARD_REGIONS = [
  { standard: 'Std 6', region: 'Region A' },
  { standard: 'Std 7', region: 'Region B' },
  { standard: 'Std 8', region: 'Region C' },
  { standard: 'Std 9', region: 'Region D' },
  { standard: 'Std 10', region: 'Region E' },
  { standard: 'Std 11', region: 'Region F' },
  { standard: 'Std 12', region: 'Region G' },
]

function SelectRegionBody() {
  const router = useRouter()
  const { token, isLoaded, selectedStandard, setAcademicRegion } = usePlayer()

  useEffect(() => {
    if (!isLoaded) return
    if (!token) router.replace('/login')
    else if (selectedStandard) router.replace('/dashboard')
  }, [token, isLoaded, selectedStandard, router])

  if (!isLoaded || !token || selectedStandard) return null

  const onSelectPcm = (item) => {
    const payload = {
      selectedStandard: item.standard,
      selectedRegion: item.region,
      selectedStream: 'PCM',
    }
    localStorage.setItem('academia_region', JSON.stringify(payload))
    setAcademicRegion(payload)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="academy-title text-lg mb-4">Select Your Standard Region (Required)</h1>
      <p className="text-xs text-slate-200 mb-6">Only PCM is active for now. Other streams are visible as coming soon.</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {STANDARD_REGIONS.map((item) => (
          <div key={item.standard} className="academy-panel p-4">
            <h2 className="text-sm mb-2 text-amber-100">{item.standard}</h2>
            <p className="text-xs text-sky-200 mb-4">{item.region}</p>
            <div className="flex flex-col gap-2">
              <button className="academy-btn-primary px-3 py-2 text-xs" onClick={() => onSelectPcm(item)}>
                Enter PCM Town
              </button>
              <button className="academy-btn-secondary px-3 py-2 text-xs cursor-not-allowed opacity-75" disabled>
                PCB (Coming Soon)
              </button>
              <button className="academy-btn-secondary px-3 py-2 text-xs cursor-not-allowed opacity-75" disabled>
                Commerce (Coming Soon)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SelectRegionPage() {
  return (
    <Providers>
      <SelectRegionBody />
    </Providers>
  )
}
