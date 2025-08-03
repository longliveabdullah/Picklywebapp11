"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OnboardingCompletePage() {
  const router = useRouter()

  const handleStart = () => {
    router.push("/home")
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-24 h-24 bg-gradient-to-r from-pickly-pink to-pickly-purple rounded-full mx-auto flex items-center justify-center mb-4"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue bg-clip-text text-transparent">
          You're all set!
        </h1>

        <p className="text-base sm:text-lg text-gray-600 font-medium max-w-md">
          Let’s level up your picks — Pickly is now ready to recommend the best products for you and only you.
        </p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button
            onClick={handleStart}
            className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue hover:from-pickly-purple hover:via-pickly-blue hover:to-pickly-teal transition-all duration-300 rounded-xl group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              Start Exploring Pickly
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </div>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
