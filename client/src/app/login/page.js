'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Providers from '../providers'
import LoginForm from '../../components/LoginForm'

function LoginPageBody() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('academia_token')
    if (token) router.replace('/dashboard')
  }, [router])

  return <LoginForm />
}

export default function LoginPage() {
  return (
    <Providers>
      <LoginPageBody />
    </Providers>
  )
}
