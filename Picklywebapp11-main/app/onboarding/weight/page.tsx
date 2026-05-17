"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Legacy route — weight is no longer collected; forward to onboarding complete. */
export default function OnboardingWeightPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/onboarding/complete")
  }, [router])

  return null
}
