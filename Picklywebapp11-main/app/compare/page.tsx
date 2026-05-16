"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { useSharedShelf } from "@/hooks/use-shared-shelf"
import { useToast } from "@/hooks/use-toast"
import {
  compareSideKey,
  compareSideSubtitle,
  compareSideTitle,
  compareVerdictFromSides,
  picklyScoreFromSide,
  type CompareSide,
} from "@/lib/compare-logic"
import { categoryMeta, getProductStatus, routineTypeMeta, fragranceMomentMeta } from "@/lib/pickly-mock-data"
import type { ShelfCategory } from "@/lib/shelf-presentation"
import { Camera, ChevronRight, Plus, Search, Sparkles, X } from "@/lib/icons"
import type { ScanHistoryItem } from "@/types"

const ease = [0.22, 1, 0.36, 1] as const

type PickerTab = "scans" | "shelf"
type SlotId = "left" | "right"

function ScoreMeter({ label, value }: { label: string; value: number | null }) {
  const pct = value === null ? 0 : Math.min(100, Math.max(0, value))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-[#92735C]/70">
        <span>{label}</span>
        {value === null ? <span className="text-[#92735C]/50">—</span> : <span className="text-[#697254]">{Math.round(pct)}%</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#DBD0C4]/40">
        <div className="h-full rounded-full bg-[#697254]/85 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CompareDetailPanel({
  side,
  emphasis,
}: {
  side: CompareSide
  emphasis: "primary" | "secondary"
}) {
  const title = compareSideTitle(side)
  const subtitle = compareSideSubtitle(side)
  const score = picklyScoreFromSide(side)
  const ring = emphasis === "primary" ? "ring-2 ring-[#697254]/35 shadow-md" : "shadow-sm"

  if (side.kind === "scan") {
    const r = side.scan.rating
    const displayScore = typeof r.rating === "number" && r.rating >= 0 ? `${r.rating}/10` : "?"
    const buy = (r.reasonsToBuy ?? []).slice(0, 3)
    const avoid = (r.reasonsToAvoid ?? []).slice(0, 3)

    return (
      <div className={`flex flex-col rounded-2xl bg-white p-4 ${ring}`}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-snug text-[#2D2D2D]">{title}</p>
            <p className="mt-0.5 text-[11px] text-[#92735C]/75">{subtitle}</p>
          </div>
          <div className="shrink-0 rounded-xl bg-[#697254]/12 px-3 py-1.5 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wide text-[#697254]/80">Pickly</p>
            <p className="text-lg font-bold leading-none text-[#697254]">{displayScore}</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-[#DBD0C4]/40 pt-3">
          <ScoreMeter label="Health" value={typeof r.healthScore === "number" ? r.healthScore : score !== null ? score * 10 : null} />
          <ScoreMeter label="Fit" value={typeof r.suitabilityScore === "number" ? r.suitabilityScore : score !== null ? score * 10 : null} />
        </div>

        {(r.summary || r.explanation) && (
          <p className="mt-3 border-t border-[#DBD0C4]/40 pt-3 text-[12px] leading-relaxed text-[#3D3D3D]/90">
            {r.summary || r.explanation}
          </p>
        )}

        {buy.length > 0 && (
          <div className="mt-3 border-t border-[#DBD0C4]/40 pt-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#697254]">Highlights</p>
            <ul className="space-y-1">
              {buy.map((line) => (
                <li key={line.slice(0, 48)} className="flex gap-2 text-[11px] leading-snug text-[#2D2D2D]/85">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#A7AD89]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {avoid.length > 0 && (
          <div className="mt-3 border-t border-[#DBD0C4]/40 pt-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#92735C]">Watch outs</p>
            <ul className="space-y-1">
              {avoid.map((line) => (
                <li key={line.slice(0, 48)} className="flex gap-2 text-[11px] leading-snug text-[#3D3D3D]/85">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#C45B4A]/70" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-3 text-[10px] text-[#92735C]/55">
          Scanned {new Date(side.scan.scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    )
  }

  const p = side.product
  const cat = categoryMeta[p.category as ShelfCategory]
  const ps = getProductStatus(p)
  const routineLabel =
    p.category === "fragrance"
      ? p.fragrance_moment
        ? fragranceMomentMeta[p.fragrance_moment].label
        : null
      : p.routine_type
        ? routineTypeMeta[p.routine_type].label
        : null

  return (
    <div className={`flex flex-col rounded-2xl bg-white p-4 ${ring}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-snug text-[#2D2D2D]">{title}</p>
          <p className="mt-0.5 text-[11px] text-[#92735C]/75">{p.brand}</p>
        </div>
        <div className="shrink-0 rounded-xl px-3 py-1.5 text-center" style={{ backgroundColor: `${cat.accent}22` }}>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[#697254]/80">Shelf</p>
          <p className="text-lg font-bold leading-none" style={{ color: cat.accent }}>
            —
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#DBD0C4]/40 pt-3">
        <span className="rounded-full bg-[#697254]/10 px-2 py-0.5 text-[10px] font-semibold text-[#697254]">{cat.label}</span>
        {routineLabel && (
          <span className="rounded-full bg-[#DBD0C4]/35 px-2 py-0.5 text-[10px] font-semibold text-[#3D3D3D]">{routineLabel}</span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ps.bg}`} style={{ color: ps.color }}>
          {ps.label}
        </span>
      </div>

      <dl className="mt-3 space-y-2 border-t border-[#DBD0C4]/40 pt-3 text-[12px]">
        <div className="flex justify-between gap-2">
          <dt className="text-[#92735C]/70">Price</dt>
          <dd className="font-semibold text-[#2D2D2D]">${p.purchase_price.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#92735C]/70">Purchased</dt>
          <dd className="font-medium text-[#2D2D2D]/90">
            {new Date(p.purchase_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </dd>
        </div>
        {p.period_after_opening != null && (
          <div className="flex justify-between gap-2">
            <dt className="text-[#92735C]/70">PAO</dt>
            <dd className="font-medium text-[#2D2D2D]/90">{p.period_after_opening} mo</dd>
          </div>
        )}
      </dl>

      <p className="mt-3 rounded-xl bg-[#B69C85]/12 px-3 py-2 text-[11px] leading-relaxed text-[#92735C]">
        Scan this product with the Scanner for a full Pickly ingredient breakdown and score.
      </p>
    </div>
  )
}

export default function ComparePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, getScanHistory } = useAuth()
  const { products: shelfProducts, shelfReady } = useSharedShelf()

  const [scans, setScans] = useState<ScanHistoryItem[]>([])
  const [scansLoading, setScansLoading] = useState(true)
  const [left, setLeft] = useState<CompareSide | null>(null)
  const [right, setRight] = useState<CompareSide | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSlot, setPickerSlot] = useState<SlotId>("left")
  const [pickerTab, setPickerTab] = useState<PickerTab>("scans")
  const [pickerQuery, setPickerQuery] = useState("")

  const reloadScans = useCallback(async () => {
    if (!user) {
      setScans([])
      setScansLoading(false)
      return
    }
    try {
      setScansLoading(true)
      const rows = await getScanHistory()
      setScans(rows.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()))
    } catch (e) {
      console.error(e)
      toast({ title: "Could not load scans", description: "Pull to try again from History.", variant: "destructive" })
      setScans([])
    } finally {
      setScansLoading(false)
    }
  }, [user, getScanHistory, toast])

  useEffect(() => {
    void reloadScans()
  }, [reloadScans])

  const openPicker = (slot: SlotId) => {
    setPickerSlot(slot)
    setPickerQuery("")
    setPickerTab("scans")
    setPickerOpen(true)
  }

  const otherKey = pickerSlot === "left" ? (right ? compareSideKey(right) : null) : left ? compareSideKey(left) : null

  const filteredScans = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    return scans.filter((s) => {
      const idKey = `scan:${s.id}`
      if (idKey === otherKey) return false
      if (!q) return true
      const name = (s.rating.productName || s.productName || "").toLowerCase()
      return name.includes(q)
    })
  }, [scans, pickerQuery, otherKey])

  const filteredShelf = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    return shelfProducts.filter((p) => {
      const idKey = `shelf:${p.id}`
      if (idKey === otherKey) return false
      if (!q) return true
      return p.product_name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    })
  }, [shelfProducts, pickerQuery, otherKey])

  const selectScan = (scan: ScanHistoryItem) => {
    const side: CompareSide = { kind: "scan", scan }
    if (pickerSlot === "left") setLeft(side)
    else setRight(side)
    setPickerOpen(false)
  }

  const selectShelfProduct = (product: (typeof shelfProducts)[number]) => {
    const side: CompareSide = { kind: "shelf", product }
    if (pickerSlot === "left") setLeft(side)
    else setRight(side)
    setPickerOpen(false)
  }

  const verdict = useMemo(() => compareVerdictFromSides(left, right), [left, right])

  const swapSides = () => {
    const a = left
    setLeft(right)
    setRight(a)
  }

  const SlotCard = ({ slot, side }: { slot: SlotId; side: CompareSide | null }) => (
    <div
      className={`relative flex min-h-[132px] flex-1 flex-col rounded-2xl border border-dashed transition-colors ${
        side
          ? "border-transparent bg-white shadow-sm"
          : "border-[#697254]/25 bg-white/60 hover:bg-white hover:border-[#697254]/35"
      }`}
    >
      {side ? (
        <>
          <button
            type="button"
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#92735C]/60 hover:bg-[#92735C]/10 hover:text-[#92735C]"
            aria-label="Clear product"
            onClick={() => {
              if (slot === "left") setLeft(null)
              else setRight(null)
            }}
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex flex-1 flex-col rounded-2xl px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#A7AD89]/50"
            onClick={() => openPicker(slot)}
          >
            <span className="mb-2 inline-flex w-fit rounded-full bg-[#697254]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#697254]">
              {slot === "left" ? "A" : "B"}
            </span>
            <p className="line-clamp-2 pr-6 text-[14px] font-bold leading-snug text-[#2D2D2D]">{compareSideTitle(side)}</p>
            <p className="mt-1 line-clamp-1 text-[11px] text-[#92735C]/75">{compareSideSubtitle(side)}</p>
            {picklyScoreFromSide(side) !== null ? (
              <p className="mt-auto pt-3 text-[12px] font-semibold text-[#697254]">{picklyScoreFromSide(side)}/10 Pickly</p>
            ) : (
              <p className="mt-auto pt-3 text-[11px] text-[#92735C]/65">Shelf item — scan for Pickly score</p>
            )}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => openPicker(slot)}
          className="flex flex-1 flex-col rounded-2xl px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#A7AD89]/50"
        >
          <span className="mb-2 inline-flex w-fit rounded-full bg-[#697254]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#697254]">
            {slot === "left" ? "Product A" : "Product B"}
          </span>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#697254]/12">
              <Plus className="h-5 w-5 text-[#697254]" />
            </div>
            <p className="text-center text-[12px] font-semibold text-[#2D2D2D]">Choose product</p>
            <p className="text-center text-[10px] leading-relaxed text-[#92735C]/65">From scans or My Shelf</p>
          </div>
        </button>
      )}
    </div>
  )

  const bothReady = Boolean(left && right)
  const winnerLeft = verdict?.winner === "left"
  const winnerRight = verdict?.winner === "right"
  const tie = verdict?.winner === "tie"

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-[#F5EFE6] pb-28">
        <div className="px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#92735C]/10"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M13 16L7 10L13 4" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-[#2D2D2D]">Compare</h1>
              <p className="mt-0.5 text-[12px] text-[#92735C]/75">Pick two products — scans and shelf items can mix.</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="px-5"
        >
          <div className="flex gap-2">
            <SlotCard slot="left" side={left} />
            <SlotCard slot="right" side={right} />
          </div>

          {bothReady && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={swapSides}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-[#697254] shadow-sm ring-1 ring-[#DBD0C4]/60 transition-colors hover:bg-[#697254]/5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Swap products
              </button>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {bothReady && verdict && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease }}
              className="overflow-hidden px-5 pt-5"
            >
              <div
                className={`rounded-2xl px-4 py-4 ${
                  tie ? "bg-[#B69C85]/15 ring-1 ring-[#B69C85]/25" : verdict.winner === null ? "bg-[#DBD0C4]/25 ring-1 ring-[#92735C]/15" : "bg-[#697254]/12 ring-1 ring-[#697254]/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80">
                    <Sparkles className="h-5 w-5 text-[#697254]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#2D2D2D]">
                      {tie ? "Too close to call" : verdict.winner === null ? "Side-by-side snapshot" : winnerLeft ? `Pickly leans toward ${compareSideTitle(left!)}` : `Pickly leans toward ${compareSideTitle(right!)}`}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#3D3D3D]/85">{verdict.marginLabel}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {bothReady && left && right && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease, delay: 0.05 }}
              className="px-5 pt-6"
            >
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#697254]/85">Details</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <CompareDetailPanel side={left} emphasis={winnerLeft ? "primary" : "secondary"} />
                <CompareDetailPanel side={right} emphasis={winnerRight ? "primary" : "secondary"} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-5 mt-8 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-[#DBD0C4]/40">
          <p className="text-[13px] font-semibold text-[#2D2D2D]">Need better coverage?</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#92735C]/75">
            Use the Scanner for new products, or manage items on My Shelf for prices and dates.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-xl border-[#DBD0C4] text-[#697254]" onClick={() => router.push("/camera")}>
              <Camera className="mr-1.5 h-4 w-4" />
              Open Scanner
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-xl border-[#DBD0C4] text-[#697254]" onClick={() => router.push("/products")}>
              My Shelf
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl border-0 bg-[#F5EFE6] p-0">
            <SheetHeader className="border-b border-[#DBD0C4]/50 px-5 pb-4 pt-6 text-left">
              <SheetTitle className="font-heading text-[#2D2D2D]">
                {pickerSlot === "left" ? "Choose product A" : "Choose product B"}
              </SheetTitle>
              <SheetDescription className="text-[#92735C]/80">
                Scanned items include Pickly scores. Shelf items show spend and shelf dates until scanned.
              </SheetDescription>
            </SheetHeader>

            <div className="flex gap-2 px-5 pb-3 pt-4">
              <button
                type="button"
                onClick={() => setPickerTab("scans")}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors ${
                  pickerTab === "scans" ? "bg-[#697254] text-[#EFE5D8]" : "bg-white text-[#697254] ring-1 ring-[#DBD0C4]/70"
                }`}
              >
                Scans
              </button>
              <button
                type="button"
                onClick={() => setPickerTab("shelf")}
                disabled={!shelfReady}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
                  pickerTab === "shelf" ? "bg-[#697254] text-[#EFE5D8]" : "bg-white text-[#697254] ring-1 ring-[#DBD0C4]/70"
                }`}
              >
                My Shelf
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92735C]/60" />
                <input
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder={pickerTab === "scans" ? "Search scans…" : "Search shelf…"}
                  className="w-full rounded-2xl border-0 bg-white py-3 pl-10 pr-4 text-sm text-[#2D2D2D] shadow-sm outline-none ring-1 ring-[#DBD0C4]/50 placeholder:text-[#92735C]/45 focus:ring-2 focus:ring-[#A7AD89]/40"
                />
              </div>
            </div>

            <div className="max-h-[46vh] overflow-y-auto px-5 pb-8">
              {pickerTab === "scans" ? (
                scansLoading ? (
                  <p className="py-10 text-center text-sm text-[#92735C]/70">Loading scans…</p>
                ) : filteredScans.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm font-semibold text-[#2D2D2D]">No scans found</p>
                    <p className="mt-1 text-xs text-[#92735C]/70">{scans.length === 0 ? "Scan a product first, then compare it here." : "Try another search."}</p>
                    <Button type="button" className="mt-4 rounded-xl bg-[#697254] text-[#EFE5D8]" size="sm" onClick={() => router.push("/camera")}>
                      Go to Scanner
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {filteredScans.map((scan) => {
                      const name = scan.rating.productName || scan.productName || "Product"
                      const sc = picklyScoreFromSide({ kind: "scan", scan })
                      return (
                        <li key={scan.id}>
                          <button
                            type="button"
                            onClick={() => selectScan(scan)}
                            className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-[#DBD0C4]/40 transition-colors hover:bg-[#697254]/5"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#697254]/12">
                              <Sparkles className="h-5 w-5 text-[#697254]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-bold text-[#2D2D2D]">{name}</p>
                              <p className="text-[11px] text-[#92735C]/65">
                                {sc !== null ? `${sc}/10 · ` : ""}
                                {new Date(scan.scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#92735C]/45" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )
              ) : !shelfReady ? (
                <p className="py-10 text-center text-sm text-[#92735C]/70">Loading shelf…</p>
              ) : filteredShelf.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-[#2D2D2D]">No shelf items</p>
                  <p className="mt-1 text-xs text-[#92735C]/70">Add products on My Shelf to compare spend and dates.</p>
                  <Button type="button" variant="outline" className="mt-4 rounded-xl border-[#DBD0C4]" size="sm" onClick={() => router.push("/products")}>
                    Open My Shelf
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredShelf.map((product) => {
                    const cat = categoryMeta[product.category as ShelfCategory]
                    return (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => selectShelfProduct(product)}
                          className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-[#DBD0C4]/40 transition-colors hover:bg-[#697254]/5"
                        >
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                            style={{ backgroundColor: `${cat.accent}22` }}
                          >
                            {product.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-bold text-[#2D2D2D]">{product.product_name}</p>
                            <p className="truncate text-[11px] text-[#92735C]/65">
                              {product.brand} · ${product.purchase_price.toFixed(2)}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#92735C]/45" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ProtectedRoute>
  )
}
