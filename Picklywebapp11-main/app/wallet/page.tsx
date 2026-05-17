"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import ProtectedRoute from "@/components/protected-route"
import { NotificationsSheet } from "@/components/notifications-sheet"
import { deriveWalletData } from "@/lib/pickly-mock-data"
import { useSharedShelf } from "@/hooks/use-shared-shelf"
import { useSharedRoutine } from "@/hooks/use-shared-routine"

const ease = [0.22, 1, 0.36, 1] as const

/* ─── Circular progress (SVG) ─── */

function EcoRing({ score }: { score: number }) {
  const size = 140
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference
  const gap = circumference - filled

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E2D8"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#697254"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${filled} ${gap}` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-[#2D2D2D]">{score}%</span>
        <span className="text-[11px] font-semibold tracking-wider text-[#92735C]/70">CLEAN</span>
      </div>
    </div>
  )
}

export default function WalletPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "purchases">("overview")
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false)
  const { products } = useSharedShelf()
  const { routine } = useSharedRoutine()
  const { monthlySpend, lastMonthDiff, cleanScore, savedAmount, breakdownData, recentPurchases } = useMemo(
    () => deriveWalletData(products),
    [products],
  )

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-[#F5EFE6] pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between px-5 pb-2 pt-5"
        >
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-[#2D2D2D]">Pickly</h1>
          <button
            type="button"
            onClick={() => setNotificationSheetOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10"
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease }}
          className="mx-5 mb-5 flex rounded-2xl bg-white p-1"
        >
          {(["overview", "purchases"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-[#697254] text-[#EFE5D8] shadow-sm"
                  : "text-[#92735C]/60"
              }`}
            >
              {tab === "overview" ? "Overview" : "Purchases"}
            </button>
          ))}
        </motion.div>

        <p className="mb-4 px-5 text-center text-[11px] text-[#92735C]/70">Spend and purchases follow prices you set on My Shelf.</p>

        {activeTab === "overview" ? (
          <div className="space-y-4 px-5">
            {/* Monthly Spend Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease }}
              className="rounded-2xl bg-[#697254] p-5"
            >
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#A7AD89]">
                Monthly Spend
              </p>
              <p className="text-3xl font-bold text-white">
                ${monthlySpend.toFixed(2)}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#A7AD89" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 12V4" />
                  <path d="M4 8l4-4 4 4" />
                </svg>
                <span className="text-xs font-medium text-[#A7AD89]">
                  {Math.abs(Math.round(lastMonthDiff))}% {lastMonthDiff <= 0 ? "less" : "more"} than last month
                </span>
              </div>
            </motion.div>

            {/* Eco Score Ring */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease }}
              className="flex flex-col items-center rounded-2xl bg-white py-6"
            >
              <EcoRing score={cleanScore} />

              <div className="mt-4 flex items-center gap-5">
                {breakdownData.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-[#2D2D2D]/70">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Product Spending Summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.26, ease }}
              className="rounded-2xl bg-white p-5"
            >
              <h3 className="mb-1 text-base font-bold text-[#2D2D2D]">
                Smart Spending
              </h3>
              <p className="text-xs leading-relaxed text-[#92735C]/70">
                You&apos;ve saved ${savedAmount} this month by choosing clean alternatives flagged by Pickly.
              </p>

              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A7AD89]/15">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#697254]">${savedAmount}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#697254]/50">
                      Saved
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B69C85]/15">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#92735C]">{cleanScore}%</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#92735C]/50">
                      Clean Score
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Wallet Insight */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.34, ease }}
              className="rounded-2xl bg-white p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#A7AD89]/15">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 017 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 017-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#92735C]/60">
                  Wallet Insight
                </span>
              </div>

              <p className="mb-4 text-[13px] italic leading-relaxed text-[#2D2D2D]/80">
                &ldquo;You bought 3 serums with similar actives this month. The Ordinary&apos;s
                Niacinamide Serum covers the same benefits at $6.50 — saving you up to $22
                while keeping your routine clean.&rdquo;
              </p>

            </motion.div>

            {/* Quick Recent Purchases (top 3) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.42, ease }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#2D2D2D]">Recent Purchases</h3>
                <button
                  onClick={() => setActiveTab("purchases")}
                  className="text-sm font-semibold text-[#697254]"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {recentPurchases.slice(0, 3).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.45 + i * 0.06, ease }}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE6] text-xl">
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-[#2D2D2D]">{item.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{ backgroundColor: `${item.tagBg}25`, color: item.tagColor }}
                        >
                          {item.tag}
                        </span>
                        <span className="text-[10px] text-[#92735C]/50">{item.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#2D2D2D]">
                        ${item.price.toFixed(2)}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* ─── Purchases Tab ─── */
          <div className="px-5">
            {/* Spend Summary Bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease }}
              className="mb-4 flex items-center justify-between rounded-2xl bg-[#697254] px-5 py-4"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A7AD89]">
                  Total This Month
                </p>
                <p className="text-xl font-bold text-white">${monthlySpend.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A7AD89]">
                  Clean Score
                </p>
                <p className="text-xl font-bold text-white">{cleanScore}%</p>
              </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease }}
              className="mb-5 rounded-2xl bg-white p-4"
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#92735C]/50">
                Spending Breakdown
              </p>
              <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-[#E8E2D8]">
                {breakdownData.map((item) => (
                  <motion.div
                    key={item.label}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ backgroundColor: item.color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4">
                {breakdownData.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] font-medium text-[#2D2D2D]/60">
                      {item.label} · {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* All Purchases */}
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#92735C]/50">
              All Transactions
            </p>
            <div className="space-y-2.5">
              {recentPurchases.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.06, ease }}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3.5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE6] text-xl">
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#2D2D2D]">{item.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: `${item.tagBg}25`, color: item.tagColor }}
                      >
                        {item.tag}
                      </span>
                      <span className="text-[10px] text-[#92735C]/50">{item.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#2D2D2D]">
                      ${item.price.toFixed(2)}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <NotificationsSheet
        open={notificationSheetOpen}
        onOpenChange={setNotificationSheetOpen}
        hasRoutine={routine.am.length + routine.pm.length > 0}
        onBuildRoutine={() => router.push("/home")}
      />
    </ProtectedRoute>
  )
}
