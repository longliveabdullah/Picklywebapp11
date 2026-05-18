"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useAnimate, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  clearOnboardingProfileDraft,
  getOnboardingProfileDraft,
} from "@/lib/onboarding-profile-storage"

const PALETTE = ["#A7AD89", "#8C916C", "#697254", "#B69C85", "#92735C", "#DBD0C4"]

/** Minimum ms to show the celebration screen before navigating to /home */
const MIN_DISPLAY_MS = 2800

const SAVE_STEPS = [
  "Saving your preferences…",
  "Personalising your experience…",
  "Almost ready…",
]

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
            y: [0, "-120vh"],
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

type SaveStatus = "saving" | "done" | "error"

export default function OnboardingCompletePage() {
  const router = useRouter()
  const { updateUser, user, loading } = useAuth()
  const { toast } = useToast()
  const [scope, animate] = useAnimate()

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saving")
  const [stepIndex, setStepIndex] = useState(0)
  const [minTimeUp, setMinTimeUp] = useState(false)
  const [ringDone, setRingDone] = useState(false)
  const saveErrorMsg = useRef<string | null>(null)

  // ── Ring + check animation ────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      await animate(
        "#ring",
        { pathLength: 1, opacity: 1 },
        { duration: 1, delay: 0.4, ease: "easeOut" },
      )
      await animate(
        "#check",
        { pathLength: 1, opacity: 1 },
        { duration: 0.4, ease: "easeOut" },
      )
      setRingDone(true)
    }
    run()
  }, [animate])

  // ── Minimum display timer ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMinTimeUp(true), MIN_DISPLAY_MS)
    return () => clearTimeout(t)
  }, [])

  // ── Cycle status messages while saving ───────────────────────────────────
  useEffect(() => {
    if (saveStatus !== "saving") return
    const interval = setInterval(
      () => setStepIndex((prev) => (prev + 1) % SAVE_STEPS.length),
      900,
    )
    return () => clearInterval(interval)
  }, [saveStatus])

  // ── Save all onboarding data immediately in the background ────────────────
  const runSave = async () => {
    if (!user) {
      saveErrorMsg.current = "You need to be signed in."
      setSaveStatus("error")
      return
    }
    try {
      const profileDraft = getOnboardingProfileDraft()
      await updateUser({
        onboardingComplete: true,
        profile: { ...user.profile, ...profileDraft },
      })
      clearOnboardingProfileDraft()
      setSaveStatus("done")
    } catch (err) {
      saveErrorMsg.current =
        err instanceof Error ? err.message : "Could not save your profile."
      setSaveStatus("error")
    }
  }

  useEffect(() => {
    // Wait until auth context has resolved before saving
    if (loading) return
    runSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // ── Auto-navigate once animation floor + save are both done ──────────────
  useEffect(() => {
    if (minTimeUp && saveStatus === "done") {
      router.replace("/home")
    }
  }, [minTimeUp, saveStatus, router])

  // ── Error retry ───────────────────────────────────────────────────────────
  const handleRetry = async () => {
    setSaveStatus("saving")
    saveErrorMsg.current = null
    await runSave()
  }

  return (
    <div
      ref={scope}
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 pb-8 pt-8"
    >
      <FloatingOrbs />

      {/* Logo + success ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        className="relative mb-8"
      >
        {/* Glow pulse */}
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.6, opacity: [0, 0.15, 0] }}
          transition={{ duration: 2, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
          style={{ backgroundColor: "#A7AD89" }}
        />

        {/* Animated ring */}
        <svg width="120" height="120" viewBox="0 0 120 120" className="absolute -inset-2">
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
            src="/images/pickly-newlogov2.png"
            alt="Pickly"
            width={64}
            height={64}
            className="rounded-full"
          />

          {/* Check badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={ringDone ? { scale: 1 } : {}}
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
        You&apos;re all set!
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 1.1, ease }}
        className="mb-2 max-w-[280px] text-center text-[15px] leading-relaxed text-[#92735C]"
      >
        Pickly is now personalised just for you. Smarter picks start now.
      </motion.p>

      {/* Brand tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="mb-10 text-center text-sm font-semibold text-[#A7AD89]"
      >
        Don&apos;t just pick — Pickly.
      </motion.p>

      {/* ── Dynamic status area ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.6, ease }}
        className="flex min-h-[64px] w-full flex-col items-center justify-center gap-3"
      >
        {saveStatus === "saving" && (
          <>
            {/* Spinner */}
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#697254]/30 border-t-[#697254]" />

            {/* Cycling message */}
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-medium text-[#92735C]"
              >
                {SAVE_STEPS[stepIndex]}
              </motion.p>
            </AnimatePresence>
          </>
        )}

        {saveStatus === "done" && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease }}
            className="text-sm font-semibold text-[#697254]"
          >
            Taking you in…
          </motion.p>
        )}

        {saveStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
            className="flex flex-col items-center gap-3"
          >
            <p className="max-w-[260px] text-center text-sm text-red-500">
              {saveErrorMsg.current ?? "Something went wrong. Please try again."}
            </p>
            <button
              onClick={handleRetry}
              className="rounded-xl bg-[#697254] px-6 py-2.5 text-sm font-semibold text-[#EFE5D8] shadow transition-opacity hover:opacity-90 active:opacity-75"
            >
              Try again
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Progress dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.8 }}
        className="mt-8 flex items-center gap-2"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-[#697254]/20" />
        ))}
        <div className="h-2.5 w-2.5 rounded-full bg-[#697254]" />
      </motion.div>
    </div>
  )
}
