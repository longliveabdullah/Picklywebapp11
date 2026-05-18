"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { updateOnboardingProfileDraft } from "@/lib/onboarding-profile-storage"

const shoppingStyles = [
  {
    id: "budget-friendly",
    title: "Budget-friendly",
    description: "Focusing on value and essentials",
  },
  {
    id: "balanced",
    title: "Balanced",
    description: "Quality goods at reasonable prices",
  },
  {
    id: "premium",
    title: "Premium",
    description: "High-quality, organic, and artisanal",
  },
  {
    id: "luxury",
    title: "Luxury",
    description: "Exclusive, rare, and top-tier sourcing",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function OnboardingShoppingStylePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleNext = () => {
    if (!selected) return
    router.push("/onboarding/complete")
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="flex min-h-[100dvh] flex-col pb-6 pt-5">
      {/* Top bar — back arrow + logo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 flex items-center"
      >
        <button
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#92735C]/10"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 16L7 10L13 4" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex flex-1 items-center justify-center pr-9">
          <Image
            src="/images/pickly-newlogov2.png"
            alt="Pickly"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="ml-2 text-base font-bold text-[#697254]">Pickly</span>
        </div>
      </motion.div>

      {/* Step + Heading */}
      <div className="mb-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="mb-1 text-xs font-medium tracking-widest text-[#92735C]/70"
        >
          STEP 3 OF 3
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="text-[24px] font-bold leading-snug text-[#2D2D2D]"
        >
          Your usual shopping
          <br />
          style?
        </motion.h1>
      </div>

      {/* Style Cards — stretch to fill available space */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="my-auto flex flex-1 flex-col gap-3 py-4"
      >
        {shoppingStyles.map((style) => {
          const isSelected = selected === style.id
          return (
            <motion.button
              key={style.id}
              variants={itemVariants}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelected(style.id)
                updateOnboardingProfileDraft({ shoppingStyle: style.id })
              }}
              className={`flex flex-1 items-center rounded-2xl px-5 text-left transition-all duration-200 ${
                isSelected
                  ? "bg-white ring-2 ring-[#697254] shadow-md"
                  : "bg-white ring-1 ring-[#D5D0C9] shadow-sm"
              }`}
            >
              <div className="flex-1">
                <p
                  className={`text-[15px] font-semibold transition-colors duration-200 ${
                    isSelected ? "text-[#2D2D2D]" : "text-[#3D3D3D]"
                  }`}
                >
                  {style.title}
                </p>
                <p className="mt-0.5 text-[13px] text-[#92735C]/80">
                  {style.description}
                </p>
              </div>

              {/* Radio circle */}
              <div
                className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-[#697254] bg-[#697254]"
                    : "border-[#C5BFB5] bg-transparent"
                }`}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="h-2.5 w-2.5 rounded-full bg-white"
                  />
                )}
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Bottom */}
      <div className="mt-auto flex w-full flex-col items-center pt-6">
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={!selected}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#697254] py-4 text-base font-semibold text-[#EFE5D8] shadow-lg transition-all duration-200 disabled:opacity-40"
        >
          Next
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === 2
                  ? "h-2.5 w-2.5 bg-[#697254]"
                  : "h-2 w-2 bg-[#92735C]/25"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
