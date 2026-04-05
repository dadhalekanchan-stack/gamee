'use client'

import { useRouter } from 'next/navigation'

export default function BackButton({ fallback = '/', label = 'Back' }) {
  const router = useRouter()

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push(fallback)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="academy-btn-secondary px-3 py-2 text-xs"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      ← {label}
    </button>
  )
}
