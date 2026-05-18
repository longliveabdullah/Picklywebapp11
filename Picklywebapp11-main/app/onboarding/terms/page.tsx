"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { clearOnboardingProfileDraft } from "@/lib/onboarding-profile-storage"
import { setOnboardingTermsAccepted } from "@/lib/onboarding-terms-storage"

const ACCENT = "#697254"
const ease = [0.22, 1, 0.36, 1] as const

export default function OnboardingTermsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [agreed, setAgreed] = useState(false)

  const handleContinue = () => {
    if (!user?.id || !agreed) return
    clearOnboardingProfileDraft()
    setOnboardingTermsAccepted(user.id)
    router.push("/onboarding/age")
  }

  return (
    <div className="flex min-h-[100dvh] flex-col pb-6 pt-10">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mb-3 text-center"
      >
        <span className="inline-block rounded-full bg-[#A7AD89] px-4 py-1.5 text-xs font-semibold tracking-wide text-white">
          Before you begin
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.06, ease }}
        className="mb-2 text-center text-[22px] font-bold leading-snug text-[#2D2D2D]"
      >
        Terms & privacy
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease }}
        className="mb-5 text-center text-sm font-medium leading-relaxed text-[#4A4A4A]"
      >
        Review our policies, then confirm to continue building your Pickly profile.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18, ease }}
        className="mb-6 max-h-[38vh] space-y-4 overflow-y-auto rounded-2xl border border-[#B69C85]/25 bg-white/80 p-4 shadow-sm"
      >
        <p className="text-[13px] leading-relaxed text-[#4A4A4A]">
          Pickly helps you evaluate beauty and personal-care products using your preferences and optional scans. The
          Service does not provide medical advice. Use product information at your own discretion and always follow
          labels and professional guidance when needed.
        </p>
        <p className="text-[13px] leading-relaxed text-[#4A4A4A]">
          By continuing, you agree to our{" "}
          <Link href="/legal/terms" className="font-semibold underline" style={{ color: ACCENT }}>
            Terms of Service
          </Link>{" "}
          and acknowledge our{" "}
          <Link href="/legal/privacy" className="font-semibold underline" style={{ color: ACCENT }}>
            Privacy Policy
          </Link>
          . You can open each document for the full text.
        </p>
        <p className="text-xs leading-relaxed text-[#92735C]/80">
          Template notice: in-app legal text should be reviewed and finalized by your counsel for your regions and data
          practices.
        </p>
      </motion.div>

      <div className="mt-auto flex w-full flex-col items-center pt-2">
        <label className="mb-4 flex w-full cursor-pointer items-start gap-3 rounded-2xl bg-white/70 p-4 shadow-sm">
          <Checkbox
            data-testid="onboarding-terms-checkbox"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(!!v)}
            className="mt-0.5 border-[#B69C85]/50 data-[state=checked]:border-[#697254] data-[state=checked]:bg-[#697254]"
          />
          <span className="text-[13px] leading-snug text-[#3D3D3D]">
            I have read and agree to the{" "}
            <Link href="/legal/terms" className="font-semibold" style={{ color: ACCENT }} onClick={(e) => e.stopPropagation()}>
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="font-semibold"
              style={{ color: ACCENT }}
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28, ease }}
          type="button"
          data-testid="onboarding-terms-continue"
          whileTap={{ scale: 0.97 }}
          disabled={!agreed || !user?.id}
          onClick={handleContinue}
          className="mb-3 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#697254] py-4 text-base font-semibold text-[#EFE5D8] shadow-lg transition-all duration-200 disabled:opacity-40"
        >
          Continue to profile setup
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M7.5 4L13.5 10L7.5 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}
