"use client"

import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

interface PicklyAssistantCardProps {
  onOpen: () => void
  onRoutineHelp: () => void
}

export function PicklyAssistantCard({ onOpen, onRoutineHelp }: PicklyAssistantCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.18, ease }}
      className="mx-5 mt-6 rounded-3xl bg-white px-6 py-6 shadow-[0_10px_40px_rgba(146,115,92,0.07)] ring-1 ring-[#E8E2D8]/90"
    >
      <button
        type="button"
        onClick={onOpen}
        className="group w-full text-left transition-[transform] active:scale-[0.995]"
      >
        <p className="text-[20px] font-semibold leading-snug tracking-[-0.02em] text-[#2D2D2D]">
          What should we look at today?
        </p>
        <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#92735C]/65">
          Ingredients, routines, and what&apos;s worth adding to your shelf.
        </p>

        <motion.div
          layout
          className="mt-6 flex items-center gap-3 rounded-2xl bg-[#F5EFE6] px-5 py-4 ring-1 ring-[#DBD0C4]/30 transition-colors group-hover:bg-[#F0E8DC]"
        >
          <span className="flex-1 text-[14px] text-[#92735C]/50">
            Ask about a product or ingredient…
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#697254] text-[#EFE5D8] shadow-sm transition-transform group-hover:translate-x-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h13M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </motion.div>
      </button>

      <button
        type="button"
        onClick={onRoutineHelp}
        className="mt-5 text-[12px] font-semibold text-[#697254] underline-offset-4 transition-colors hover:text-[#2D2D2D] hover:underline"
      >
        Routine help
      </button>
    </motion.section>
  )
}
