"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

const ACCENT = "#697254"

export function LegalPageShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F5EFE6] pb-14">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#B69C85]/25 bg-[#F5EFE6]/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[#92735C]/10"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 text-lg font-bold leading-tight text-[#2D2D2D]">{title}</h1>
      </header>
      <div className="mx-auto max-w-lg px-4 py-6">{children}</div>
    </div>
  )
}
