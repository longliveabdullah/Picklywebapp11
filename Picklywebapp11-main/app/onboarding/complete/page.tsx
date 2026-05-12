"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, useAnimate } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

const PALETTE = ["#A7AD89", "#8C916C", "#697254", "#B69C85", "#92735C", "#DBD0C4"]

function FloatingOrbs() {
  const orbs = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 6 + Math.random() * 14,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      opacity: 0.15 + Math.random() * 0.25,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 3,
      drift: -30 + Math.random() * 60,
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            left: `${orb.x}%`,
            bottom: "-5%",
            width: orb.size,
            height: orb.size,
            backgroundColor: orb.color,
            opacity: 0,
          }}
          animate={{
            y: [0, -window.innerHeight * 1.2],
            x: [0, orb.drift],
            opacity: [0, orb.opacity, orb.opacity, 0],
            scale: [0.5, 1, 1, 0.3],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

const ease = [0.22, 1, 0.36, 1] as const

export default function OnboardingCompletePage() {
  const router = useRouter()
  const { updateUser } = useAuth()
  const { toast } = useToast()
  const [scope, animate] = useAnimate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const run = async () => {
      await animate(
        "#ring",
        { pathLength: 1, opacity: 1 },
        { duration: 1, delay: 0.4, ease: "easeOut" }
      )
      await animate(
        "#check",
        { pathLength: 1, opacity: 1 },
        { duration: 0.4, ease: "easeOut" }
      )
      setReady(true)
    }
    run()
  }, [animate])

  const handleStart = async () => {
    try {
      await updateUser({ onboardingComplete: true })
      router.push("/home")
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not complete your onboarding. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      ref={scope}
      className="flex min-h-[100dvh] flex-col items-center justify-center pb-8 pt-8"
    >
      <FloatingOrbs />

      {/* Logo + Success Ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        className="relative mb-8"
      >
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.6, opacity: [0, 0.15, 0] }}
          transition={{ duration: 2, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
          style={{ backgroundColor: "#A7AD89" }}
        />

        {/* Ring SVG */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          className="absolute -inset-2"
        >
          <motion.circle
            id="ring"
            cx="60"
            cy="60"
            r="56"
            fill="none"
            stroke="#697254"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            style={{ rotate: -90, transformOrigin: "center" }}
          />
        </svg>

        {/* Logo */}
        <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full bg-white shadow-lg">
          <Image
            src="/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png"
            alt="Pickly"
            width={64}
            height={64}
            className="rounded-full"
          />

          {/* Check badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={ready ? { scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#697254] shadow-md"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <motion.path
                id="check"
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
              />
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9, ease }}
        className="mb-3 text-center text-[28px] font-bold leading-tight text-[#2D2D2D]"
      >
        You're all set!
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 1.1, ease }}
        className="mb-2 max-w-[280px] text-center text-[15px] leading-relaxed text-[#92735C]"
      >
        Pickly is now personalized just for you. Smarter picks start now.
      </motion.p>

      {/* Brand tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="mb-10 text-center text-sm font-semibold text-[#A7AD89]"
      >
        Don't just pick — Pickly.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 1.6, ease }}
        whileTap={{ scale: 0.97 }}
        onClick={handleStart}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#697254] py-4 text-base font-semibold text-[#EFE5D8] shadow-lg transition-shadow hover:shadow-xl"
      >
        Start Exploring
        <motion.svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, delay: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
      </motion.button>

      {/* Footer dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.8 }}
        className="mt-6 flex items-center gap-2"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-[#697254]/20"
          />
        ))}
        <div className="h-2.5 w-2.5 rounded-full bg-[#697254]" />
      </motion.div>
    </div>
  )
}
