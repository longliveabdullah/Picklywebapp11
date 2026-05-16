/** Session flag: user acknowledged legal terms during onboarding (per user id). */

export function onboardingTermsStorageKey(userId: string) {
  return `pickly-onboarding-terms-v1:${userId}`
}

export function setOnboardingTermsAccepted(userId: string) {
  if (typeof sessionStorage === "undefined") return
  sessionStorage.setItem(onboardingTermsStorageKey(userId), new Date().toISOString())
}

export function hasAcceptedOnboardingTerms(userId: string): boolean {
  if (typeof sessionStorage === "undefined") return false
  return !!sessionStorage.getItem(onboardingTermsStorageKey(userId))
}

export function clearOnboardingTermsAcceptance(userId: string) {
  if (typeof sessionStorage === "undefined") return
  sessionStorage.removeItem(onboardingTermsStorageKey(userId))
}
