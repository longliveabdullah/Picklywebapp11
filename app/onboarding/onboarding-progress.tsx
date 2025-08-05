"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/page-transition"

const steps = [
  { path: "/onboarding/age", label: "Age" },
  { path: "/onboarding/gender", label: "Gender" },
  { path: "/onboarding/height", label: "Height" },
  { path: "/onboarding/weight", label: "Weight" },
]

export function OnboardingProgress({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentStepIndex = steps.findIndex((step) => step.path === pathname)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <>
      {/* Progress Section */}
      <div className="mb-12">
        <div className="mb-4 flex justify-between text-sm font-medium text-gray-600">
          <span>
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="relative h-3 w-full rounded-full bg-white/30 backdrop-blur-sm overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full" />

          {/* Animated Progress Bar */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue shadow-lg"
            style={{ width: `${progress}%` }}
          />

          {/* Shimmer effect */}
          <div
            className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <div key={step.path} className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full mb-2 ${
                  index <= currentStepIndex
                    ? "bg-gradient-to-r from-pickly-pink to-pickly-purple shadow-lg"
                    : "bg-gray-300"
                }`}
              />
              <span
                className={`text-xs font-medium ${index <= currentStepIndex ? "text-gray-700" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Page Content with Transition */}
      <PageTransition>{children}</PageTransition>
    </>
  )
}
