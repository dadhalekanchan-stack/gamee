'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Providers from '../providers'
import LoginForm from '../../components/LoginForm'
import BackButton from '../../components/BackButton'
import { isOnboardingDone } from '../../lib/onboarding'

function LoginPageBody() {
  const router = useRouter()

  useEffect(() => {
    if (!isOnboardingDone()) {
      router.replace('/tutorial')
      return
    }
    const token = localStorage.getItem('academia_token')
    if (token) router.replace('/dashboard')
  }, [router])

  return (
    <div>
      <div className="px-4 pt-4">
        <BackButton fallback="/" label="Home" />
      </div>
      <LoginForm />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Providers>
      <LoginPageBody />
    </Providers>
  )
}
