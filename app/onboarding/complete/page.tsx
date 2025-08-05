"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Confetti } from "@/components/confetti"

export default function OnboardingCompletePage() {
  const router = useRouter()

  const handleStart = () => {
    router.push("/home")
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Confetti />
      <div className="space-y-6">
        <div className="w-24 h-24 bg-gradient-to-r from-pickly-pink to-pickly-purple rounded-full mx-auto flex items-center justify-center mb-4">
          <Sparkles className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue bg-clip-text text-transparent">
          You're all set!
        </h1>

        <p className="text-base sm:text-lg text-gray-600 font-medium max-w-md">
          Let’s level up your picks — Pickly is now ready to recommend the best products for you and only you.
        </p>

        <div>
          <Button
            onClick={handleStart}
            className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue hover:from-pickly-purple hover:via-pickly-blue hover:to-pickly-teal transition-all duration-300 rounded-xl group"
          >
            <div className="flex items-center gap-3">
              Start Exploring Pickly
              <div className="h-5 w-5" />
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
