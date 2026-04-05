'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Providers from '../providers'
import BackButton from '../../components/BackButton'
import { markOnboardingDone } from '../../lib/onboarding'

const STEPS = [
  {
    title: 'Welcome to Academia',
    body: 'This is a learning RPG where your answers power your progress.',
  },
  {
    title: 'How to Start',
    body: 'Login, select your standard/region, then press PLAY on dashboard.',
  },
  {
    title: 'How to Answer',
    body: 'In battle, choose one option. You instantly see correct/incorrect feedback before continuing.',
  },
  {
    title: 'Scoring & Progress',
    body: 'Correct answers give EXP and levels. Wrong answers reduce HP. Gym wins unlock badges.',
  },
]

function TutorialBody() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)

  const from = searchParams.get('from')
  const returnTo = useMemo(() => {
    if (from === 'dashboard') return '/dashboard'
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('academia_token') : null
    return token ? '/dashboard' : '/login'
  }, [from])

  const complete = () => {
    markOnboardingDone()
    router.push(returnTo)
  }

  return (
    <div className="min-h-screen p-6 md:p-10 text-slate-100 bg-[radial-gradient(circle_at_20%_20%,#26438e_0%,#132c6b_35%,#081433_70%,#050b1c_100%)]">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5 flex items-center justify-between gap-3">
          <BackButton fallback={returnTo} label="Back" />
          <button className="academy-btn-secondary px-3 py-2 text-xs" onClick={complete} style={{ fontFamily: 'Arial, sans-serif' }}>
            Skip Tutorial
          </button>
        </div>

        <div className="academy-panel rounded p-6 md:p-8">
          <p className="text-xs text-sky-200 mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
            Tutorial {step + 1} / {STEPS.length}
          </p>
          <h1 className="academy-title text-2xl md:text-3xl mb-3" style={{ fontFamily: 'Arial, sans-serif' }}>
            {STEPS[step].title}
          </h1>
          <p className="text-sm md:text-base text-slate-100 mb-6" style={{ fontFamily: 'Arial, sans-serif' }}>
            {STEPS[step].body}
          </p>

          <div className="w-full h-2 bg-slate-800 border border-sky-700 mb-6">
            <div className="h-2 bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              className="academy-btn-secondary px-4 py-2 text-sm disabled:opacity-50"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              Previous
            </button>

            {step < STEPS.length - 1 ? (
              <button
                className="academy-btn-primary px-5 py-2 text-sm"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                Next
              </button>
            ) : (
              <button className="academy-btn-primary px-5 py-2 text-sm" onClick={complete} style={{ fontFamily: 'Arial, sans-serif' }}>
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TutorialPage() {
  return (
    <Providers>
      <TutorialBody />
    </Providers>
  )
}
