'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isOnboardingDone } from '../lib/onboarding'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (!isOnboardingDone()) {
      router.replace('/tutorial')
      return
    }
    const token = localStorage.getItem('academia_token')
    if (token) router.replace('/dashboard')
    else router.replace('/login')
  }, [router])

  return null
}
