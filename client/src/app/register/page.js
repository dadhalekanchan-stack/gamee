'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Providers from '../providers'
import RegisterForm from '../../components/RegisterForm'

function RegisterPageBody() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('academia_token')
    if (token) router.replace('/dashboard')
  }, [router])

  return <RegisterForm />
}

export default function RegisterPage() {
  return (
    <Providers>
      <RegisterPageBody />
    </Providers>
  )
}
