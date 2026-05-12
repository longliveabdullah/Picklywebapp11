"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

const SPLASH_DURATION_MS = 2500
const SPLASH_GRADIENT = "linear-gradient(to bottom, #697254 0%, #8C916C 50%, #697254 100%)"

export default function SplashPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // Logged-in users skip splash and go to app
    if (user) {
      if (!user.onboardingComplete) {
        router.replace("/onboarding/age")
      } else {
        router.replace("/home")
      }
      return
    }

    const t = setTimeout(() => {
      router.replace("/auth")
    }, SPLASH_DURATION_MS)
    return () => clearTimeout(t)
  }, [user, loading, router])

  if (loading) {
    return null
  }

  if (user) {
    return null
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: SPLASH_GRADIENT }}
    >
      <motion.div
        className="flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        >
          <Image
            src="/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png"
            alt="Pickly"
            width={120}
            height={120}
            className="object-contain rounded-full drop-shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            priority
          />
        </motion.div>
        <motion.p
          className="mt-6 text-xl font-semibold tracking-tight text-[#EFE5D8]/95"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Pickly
        </motion.p>
      </motion.div>
      <motion.div
        className="absolute bottom-12 left-1/2 h-1 w-24 -translate-x-1/2 overflow-hidden rounded-full bg-[#EFE5D8]/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full rounded-full bg-[#EFE5D8]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: SPLASH_DURATION_MS / 1000,
            ease: "linear",
          }}
        />
      </motion.div>
    </div>
  )
}
