'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Providers from '../providers'
import RegisterForm from '../../components/RegisterForm'
import BackButton from '../../components/BackButton'
import { isOnboardingDone } from '../../lib/onboarding'

function RegisterPageBody() {
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
        <BackButton fallback="/login" label="Login" />
      </div>
      <RegisterForm />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Providers>
      <RegisterPageBody />
    </Providers>
  )
}
