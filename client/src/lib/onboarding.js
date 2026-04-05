const ONBOARDING_KEY = 'academia_onboarding_done'

export function isOnboardingDone() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ONBOARDING_KEY) === '1'
}

export function markOnboardingDone() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONBOARDING_KEY, '1')
}

export { ONBOARDING_KEY }
