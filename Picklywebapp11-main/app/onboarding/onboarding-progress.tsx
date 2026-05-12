"use client"

import type { ReactNode } from "react"
import { PageTransition } from "@/components/page-transition"

export function OnboardingProgress({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
