import type { ReactNode } from "react"
import { AnimatedLogo } from "@/components/animated-logo"
import { AnimatedBackground } from "@/components/animated-background"
import { OnboardingProgress } from "./onboarding-progress"

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="container flex h-20 items-center justify-center">
          <AnimatedLogo />
        </div>
        <div className="container flex-1 relative">
          <div className="mx-auto max-w-md py-8">
            <OnboardingProgress>{children}</OnboardingProgress>
          </div>
        </div>
      </div>
    </div>
  )
}
