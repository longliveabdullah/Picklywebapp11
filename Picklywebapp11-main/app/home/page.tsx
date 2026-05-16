"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PicklyAssistantCard } from "@/components/pickly-assistant-card"
import { RoutineBuilderCard } from "@/components/routine-builder-card"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { categoryMeta, formatDate, getProductStatus, type SharedShelfProduct } from "@/lib/pickly-mock-data"
import { useProfileHeader } from "@/hooks/use-profile-header"
import { ProfileAvatar } from "@/components/profile-avatar"
import { useSharedRoutine } from "@/hooks/use-shared-routine"
import { useSharedShelf } from "@/hooks/use-shared-shelf"

const ease = [0.22, 1, 0.36, 1] as const


export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [previewProduct, setPreviewProduct] = useState<SharedShelfProduct | null>(null)
  const [routinePeriod, setRoutinePeriod] = useState<"am" | "pm">("am")
  const [routineSheetOpen, setRoutineSheetOpen] = useState(false)
  const { routine, changeStepProduct, addStep, removeStep } = useSharedRoutine()
  const { products: shelfProducts } = useSharedShelf()

  const { displayName, avatarUrl } = useProfileHeader(user?.id, user?.email)

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="min-h-screen bg-[#F5EFE6] pb-24">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-3 px-5 pb-2 pt-5"
        >
          <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} size="sm" />

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[#2D2D2D]">
              Hi, {displayName}!
            </p>
          </div>

          {/* Notification */}
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>

          {/* Settings */}
          <button
            onClick={() => router.push("/settings")}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </motion.div>

        {/* Explore Section */}
        <div className="pt-5">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease }}
            className="mb-3 px-5 text-xl font-bold text-[#2D2D2D]"
          >
            Explore
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease }}
            className="flex gap-3 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Scanner Card — Sage */}
            <button
              onClick={() => router.push("/camera")}
              className="flex w-[145px] shrink-0 flex-col items-center justify-start rounded-2xl bg-[#A7AD89]/15 px-4 pb-5 pt-5 text-center transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#A7AD89]/25">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 3H3v4"/>
                  <path d="M17 3h4v4"/>
                  <path d="M7 21H3v-4"/>
                  <path d="M17 21h4v-4"/>
                  <rect x="7" y="7" width="10" height="10" rx="1"/>
                </svg>
              </div>
              <p className="text-[14px] font-bold text-[#2D2D2D]">Scanner</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#697254]/70">
                Identify clean beauty ingredients instantly.
              </p>
            </button>

            {/* Pickly Wallet Card — Sand */}
            <button
              onClick={() => router.push("/wallet")}
              className="flex w-[145px] shrink-0 flex-col items-center justify-start rounded-2xl bg-[#B69C85]/15 px-4 pb-5 pt-5 text-center transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#B69C85]/25">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M2 10h20"/>
                  <path d="M6 16h4"/>
                  <path d="M14 16h4"/>
                </svg>
              </div>
              <p className="text-[14px] font-bold text-[#2D2D2D]">Pickly Wallet</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#92735C]/70">
                Track your beauty spending &amp; budget smarter.
              </p>
            </button>

            {/* Compare Card — Forest */}
            <button
              onClick={() => router.push("/products")}
              className="flex w-[145px] shrink-0 flex-col items-center justify-start rounded-2xl bg-[#697254]/10 px-4 pb-5 pt-5 text-center transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#697254]/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="8" height="16" rx="1.5"/>
                  <rect x="14" y="4" width="8" height="16" rx="1.5"/>
                  <path d="M10 9h4" strokeDasharray="2 2"/>
                  <path d="M10 12h4"/>
                  <path d="M10 15h4" strokeDasharray="2 2"/>
                </svg>
              </div>
              <p className="text-[14px] font-bold text-[#2D2D2D]">Compare</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#697254]/70">
                Put two products side by side &amp; pick the best.
              </p>
            </button>

            {/* My Shelf Card — Earth */}
            <button
              onClick={() => router.push("/history")}
              className="flex w-[145px] shrink-0 flex-col items-center justify-start rounded-2xl bg-[#92735C]/12 px-4 pb-5 pt-5 text-center transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#92735C]/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  <path d="M8 7h8"/>
                  <path d="M8 11h5"/>
                </svg>
              </div>
              <p className="text-[14px] font-bold text-[#2D2D2D]">My Shelf</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#92735C]/70">
                Your personal collection of saved products.
              </p>
            </button>
          </motion.div>
        </div>

        <PicklyAssistantCard
          onOpen={() => router.push("/assistant")}
          onRoutineHelp={() => router.push("/assistant")}
        />
        {/* Routine Builder Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22, ease }}
          className="mx-5 mt-4"
        >
          <button
            onClick={() => setRoutineSheetOpen(true)}
            className="w-full rounded-2xl bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold text-[#2D2D2D]">Build My Routine</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#92735C]/70">
                  Curate your AM and PM steps using products already saved in your shelf.
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#697254]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#697254]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#697254]">
                AM {routine.am.length} steps
              </span>
              <span className="rounded-full bg-[#92735C]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#92735C]">
                PM {routine.pm.length} steps
              </span>
              <span className="rounded-full bg-[#A7AD89]/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#697254]">
                Shelf Powered
              </span>
            </div>
          </button>
        </motion.div>

        {/* My Shelf Section */}
        <div className="pt-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
            className="mb-3 flex items-center justify-between px-5"
          >
            <h2 className="text-xl font-bold text-[#2D2D2D]">My Shelf</h2>
            <button onClick={() => router.push("/products?add=true")} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#697254] shadow-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3v10"/>
                <path d="M3 8h10"/>
              </svg>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease }}
            className="flex gap-3 overflow-x-auto px-5 pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {shelfProducts.length === 0 ? (
              <p className="py-2 text-[13px] leading-relaxed text-[#92735C]/75">
                Your shelf is empty. Add items from{" "}
                <button type="button" className="font-semibold text-[#697254] underline" onClick={() => router.push("/products?add=true")}>
                  My Shelf
                </button>{" "}
                or save a scan.
              </p>
            ) : (
              shelfProducts.map((product) => {
              const meta = categoryMeta[product.category] || categoryMeta.skin
              const ps = getProductStatus(product)
              return (
                <div
                  key={product.id}
                  onClick={() => setPreviewProduct(product)}
                  className="flex w-[165px] shrink-0 cursor-pointer flex-col rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className="mb-3 flex h-20 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${meta.accent}18` }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={meta.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3C12 3 8 3 8 7v3h8V7c0-4-4-4-4-4z"/>
                      <rect x="7" y="10" width="10" height="12" rx="2"/>
                      <path d="M7 14h10"/>
                    </svg>
                  </div>
                  <p className="truncate text-[13px] font-bold leading-snug text-[#2D2D2D]">{product.product_name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#92735C]/60">{product.brand}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: `${meta.accent}18`, color: meta.accent }}
                    >
                      {meta.label}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${ps.bg}`} style={{ color: ps.color }}>
                      {ps.label}
                    </span>
                  </div>
                </div>
              )
            })
            )}
          </motion.div>
        </div>

        {/* Product Preview Modal */}
        <AnimatePresence>
          {previewProduct && (() => {
            const meta = categoryMeta[previewProduct.category] || categoryMeta.skin
            const ps = getProductStatus(previewProduct)
            const paoUsed = previewProduct.opened_date && previewProduct.period_after_opening
              ? (() => {
                  const months = Math.floor((Date.now() - new Date(previewProduct.opened_date).getTime()) / (30.44 * 86400000))
                  return { used: months, total: previewProduct.period_after_opening!, pct: Math.min(100, (months / previewProduct.period_after_opening!) * 100) }
                })()
              : null
            return (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
                onClick={() => setPreviewProduct(null)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md rounded-t-3xl bg-[#F5EFE6]"
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="h-1 w-10 rounded-full bg-[#92735C]/25" />
                  </div>

                  <div className="px-6 pb-24 pt-2">
                    {/* Hero area */}
                    <div className="mb-5 flex items-center gap-4">
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${meta.accent}20` }}
                      >
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={meta.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3C12 3 8 3 8 7v3h8V7c0-4-4-4-4-4z"/>
                          <rect x="7" y="10" width="10" height="12" rx="2"/>
                          <path d="M7 14h10"/>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-[#2D2D2D]">{previewProduct.product_name}</p>
                        <p className="text-sm text-[#92735C]/70">{previewProduct.brand}</p>
                      </div>
                      <button onClick={() => setPreviewProduct(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[#92735C]/10">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round">
                          <path d="M4 4l10 10"/><path d="M14 4L4 14"/>
                        </svg>
                      </button>
                    </div>

                    {/* Status + Category badges */}
                    <div className="mb-5 flex flex-wrap gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{ backgroundColor: `${meta.accent}18`, color: meta.accent }}
                      >
                        {meta.label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${ps.bg}`} style={{ color: ps.color }}>
                        {ps.label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        previewProduct.status === "opened" ? "bg-[#B69C85]/15 text-[#92735C]" : "bg-[#697254]/10 text-[#697254]"
                      }`}>
                        {previewProduct.status === "opened" ? "Opened" : "Sealed"}
                      </span>
                    </div>

                    {/* Info grid */}
                    <div className="mb-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#92735C]/50">Expiry Date</p>
                        <p className="mt-1 text-sm font-bold text-[#2D2D2D]">{formatDate(previewProduct.expiry_date)}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#92735C]/50">Added On</p>
                        <p className="mt-1 text-sm font-bold text-[#2D2D2D]">{formatDate(previewProduct.created_at)}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#92735C]/50">PAO</p>
                        <p className="mt-1 text-sm font-bold text-[#2D2D2D]">
                          {previewProduct.period_after_opening ? `${previewProduct.period_after_opening}M` : "—"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#92735C]/50">Opened Date</p>
                        <p className="mt-1 text-sm font-bold text-[#2D2D2D]">{formatDate(previewProduct.opened_date)}</p>
                      </div>
                    </div>

                    {/* PAO progress bar */}
                    {paoUsed && (
                      <div className="mb-5 rounded-2xl bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#2D2D2D]">Usage Timeline</p>
                          <p className="text-xs font-bold" style={{ color: paoUsed.pct >= 80 ? "#C45B4A" : "#697254" }}>
                            {paoUsed.used} of {paoUsed.total} months
                          </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#DBD0C4]/40">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${paoUsed.pct}%`,
                              backgroundColor: paoUsed.pct >= 80 ? "#C45B4A" : paoUsed.pct >= 50 ? "#B69C85" : "#A7AD89",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setPreviewProduct(null); router.push("/products") }}
                        className="flex-1 rounded-2xl bg-[#697254] py-3.5 text-center text-sm font-semibold text-[#EFE5D8] shadow-md"
                      >
                        View on Shelf
                      </button>
                      <button
                        onClick={() => setPreviewProduct(null)}
                        className="flex-1 rounded-2xl py-3.5 text-center text-sm font-semibold text-[#3D3D3D] ring-1 ring-[#DBD0C4]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
        </AnimatePresence>

        <Sheet open={routineSheetOpen} onOpenChange={setRoutineSheetOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#F5EFE6] pb-10">
            <SheetHeader className="mb-5">
              <SheetTitle className="text-lg font-bold text-[#2D2D2D]">Routine Builder</SheetTitle>
            </SheetHeader>
            <RoutineBuilderCard
              period={routinePeriod}
              steps={routine[routinePeriod]}
              products={shelfProducts}
              onPeriodChange={setRoutinePeriod}
              onChangeStepProduct={(stepId, productId) => changeStepProduct(routinePeriod, stepId, productId)}
              onAddStep={(type) => addStep(routinePeriod, type)}
              onRemoveStep={(stepId) => removeStep(routinePeriod, stepId)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </ProtectedRoute>
  )
}
