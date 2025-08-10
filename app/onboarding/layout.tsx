import type { ReactNode } from "react"
import { Logo } from "@/components/logo" // Use static logo
import { OnboardingProgress } from "./onboarding-progress"

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    // Removed relative and overflow-hidden as the animated background is gone
    <div className="flex min-h-screen flex-col">
      {/* <AnimatedBackground /> Removed for performance */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="container flex h-20 items-center justify-center">
          <Logo />
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
