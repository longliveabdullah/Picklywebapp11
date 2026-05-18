"use client"

import type { UserProfile } from "@/types"

const ONBOARDING_PROFILE_DRAFT_KEY = "pickly-onboarding-profile-draft"

export function getOnboardingProfileDraft(): Partial<UserProfile> {
  try {
    const raw = localStorage.getItem(ONBOARDING_PROFILE_DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Partial<UserProfile>) : {}
  } catch {
    return {}
  }
}

export function updateOnboardingProfileDraft(updates: Partial<UserProfile>) {
  const nextDraft = {
    ...getOnboardingProfileDraft(),
    ...updates,
  }

  localStorage.setItem(ONBOARDING_PROFILE_DRAFT_KEY, JSON.stringify(nextDraft))
  return nextDraft
}

export function clearOnboardingProfileDraft() {
  localStorage.removeItem(ONBOARDING_PROFILE_DRAFT_KEY)
}
