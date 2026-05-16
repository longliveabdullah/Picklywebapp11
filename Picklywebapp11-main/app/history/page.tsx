"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  CalendarDays,
  Clock3,
  Heart,
  ScanLine,
  Sparkles,
  Star,
  Trash2,
} from "@/lib/icons"
import { AnimatePresence, motion } from "framer-motion"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

const ease = [0.22, 1, 0.36, 1] as const

interface ScanHistoryItem {
  id: string
  imageUrl?: string
  productName?: string
  rating: {
    rating: number
    explanation: string
    recommendations: string[]
  }
  scannedAt: Date
}

interface FutureBuyItem extends ScanHistoryItem {
  sourceScanId: string
  addedAt: Date
}

export default function HistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, getScanHistory, deleteScanFromHistory } = useAuth()

  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [futureBuys, setFutureBuys] = useState<FutureBuyItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FutureBuyItem | ScanHistoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [futureBuysLoaded, setFutureBuysLoaded] = useState(false)

  useEffect(() => {
    const loadScanHistory = async () => {
      if (!user) {
        setScanHistory([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const historyData = await getScanHistory()
        const transformedHistory: ScanHistoryItem[] = historyData.map((item) => ({
          id: item.id,
          imageUrl: item.imageUrl,
          productName: item.productName,
          rating: {
            rating: item.rating.rating,
            explanation: item.rating.explanation,
            recommendations: item.rating.recommendations ?? [],
          },
          scannedAt: new Date(item.scannedAt),
        }))

        setScanHistory(
          transformedHistory.sort((first, second) => second.scannedAt.getTime() - first.scannedAt.getTime()),
        )
      } catch (error) {
        console.error("Error loading scan history:", error)
        toast({
          title: "Error loading history",
          description: "Failed to load your scan history. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadScanHistory()
  }, [user, getScanHistory, toast])

  useEffect(() => {
    if (!user) {
      setFutureBuys([])
      setFutureBuysLoaded(false)
      return
    }

    fetch("/api/future-buys")
      .then((r) => r.json())
      .then((d) => {
        if (!d.items) return
        const items: FutureBuyItem[] = d.items.map((row: { id: string; scan_id: string | null; product_name: string | null; snapshot: Record<string, unknown>; added_at: string }) => ({
          id: row.id,
          sourceScanId: row.scan_id ?? row.id,
          productName: row.product_name ?? (row.snapshot?.productName as string | undefined),
          imageUrl: row.snapshot?.imageUrl as string | undefined,
          rating: (row.snapshot?.rating as FutureBuyItem["rating"] | undefined) ?? { rating: 0, explanation: "", recommendations: [] },
          scannedAt: new Date(row.snapshot?.scannedAt as string ?? row.added_at),
          addedAt: new Date(row.added_at),
        }))
        setFutureBuys(items)
      })
      .catch(() => setFutureBuys([]))
      .finally(() => setFutureBuysLoaded(true))
  }, [user])

  const latestScan = scanHistory[0] ?? null
  const recentScans = latestScan ? scanHistory.slice(1) : scanHistory

  const saveToFutureBuys = async (scan: ScanHistoryItem) => {
    const alreadySaved = futureBuys.some((item) => item.sourceScanId === scan.id)
    if (alreadySaved) {
      toast({ title: "Already saved", description: `${scan.productName || "This scan"} is already in your future buys.` })
      return
    }

    try {
      const res = await fetch("/api/future-buys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan_id: scan.id,
          product_name: scan.productName ?? null,
          snapshot: {
            productName: scan.productName,
            imageUrl: scan.imageUrl,
            rating: scan.rating,
            scannedAt: scan.scannedAt.toISOString(),
          },
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      const row = d.item
      const newItem: FutureBuyItem = {
        id: row.id,
        sourceScanId: scan.id,
        productName: scan.productName,
        imageUrl: scan.imageUrl,
        rating: scan.rating,
        scannedAt: scan.scannedAt,
        addedAt: new Date(row.added_at),
      }
      setFutureBuys((cur) => [newItem, ...cur])
      toast({ title: "Saved for later", description: `${scan.productName || "This product"} is now in your future buys.` })
    } catch {
      toast({ title: "Could not save", description: "Please try again.", variant: "destructive" })
    }
  }

  const removeFromFutureBuys = async (itemId: string, productName?: string) => {
    try {
      await fetch("/api/future-buys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      })
    } catch { /* swallow — optimistic UI still removes it */ }
    setFutureBuys((cur) => cur.filter((item) => item.id !== itemId))
    if (selectedItem?.id === itemId) setSelectedItem(null)
    toast({ title: "Removed from future buys", description: `${productName || "The product"} has been removed.` })
  }

  const handleDeleteScan = async (scanId: string) => {
    if (!user) return

    try {
      await deleteScanFromHistory(scanId)
      setScanHistory((current) => current.filter((scan) => scan.id !== scanId))

      if (selectedItem?.id === scanId) {
        setSelectedItem(null)
      }

      toast({
        title: "Scan deleted",
        description: "This scan was removed from your history.",
      })
    } catch (error) {
      console.error("Error deleting scan:", error)
      toast({
        title: "Could not delete scan",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const isSavedForLater = (scanId: string) => futureBuys.some((item) => item.sourceScanId === scanId)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F5EFE6] pb-28">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between gap-3 px-5 pb-2 pt-5"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#92735C]/65">History</p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight text-[#2D2D2D]">Future buys &amp; last scans</h1>
          </div>

          <button
            onClick={() => router.push("/camera")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#697254] shadow-sm transition-transform hover:scale-[1.03]"
            aria-label="Scan a new product"
          >
            <ScanLine className="h-5 w-5 text-[#EFE5D8]" />
          </button>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease }}
          className="mx-5 mt-3 overflow-hidden rounded-[30px] bg-[#697254] p-5 text-[#EFE5D8] shadow-lg"
        >
          <div className="relative">
            <motion.div
              animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#A7AD89]/20"
            />
            <motion.div
              animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="pointer-events-none absolute -bottom-16 right-10 h-32 w-32 rounded-full bg-[#B69C85]/15"
            />

            <div className="relative">
              <Badge className="border-0 bg-white/12 px-3 py-1 text-[11px] font-semibold text-[#EFE5D8]">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Curated for your next decision
              </Badge>

              <h2 className="mt-4 max-w-xs text-[28px] font-bold leading-tight">
                Keep the best finds close and revisit every scan with context.
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#EFE5D8]/78">
                Save products you want to buy later, review your latest scans, and quickly spot what is actually worth
                coming back to.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InsightCard
                  icon={<Heart className="h-4 w-4 text-[#EFE5D8]" />}
                  label="Future buys"
                  value={String(futureBuys.length)}
                  helper={futureBuys.length > 0 ? "Saved for later" : "Start saving picks"}
                />
                <InsightCard
                  icon={<Clock3 className="h-4 w-4 text-[#EFE5D8]" />}
                  label="Recent scans"
                  value={String(scanHistory.length)}
                  helper={latestScan ? formatRelativeDate(latestScan.scannedAt) : "No scans yet"}
                />
              </div>
            </div>
          </div>
        </motion.section>

        {isLoading ? (
          <div className="flex items-center justify-center px-5 py-20">
            <motion.div
              className="h-10 w-10 rounded-full border-[3px] border-[#697254]/20 border-t-[#697254]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </div>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease }}
              className="pt-7"
            >
              <div className="mb-3 flex items-end justify-between px-5">
                <div>
                  <h2 className="text-xl font-bold text-[#2D2D2D]">Future buys</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#92735C]/72">
                    Products you want to remember for your next purchase.
                  </p>
                </div>
                <span className="rounded-full bg-[#92735C]/10 px-3 py-1 text-[11px] font-semibold text-[#92735C]">
                  {futureBuys.length} saved
                </span>
              </div>

              {futureBuys.length === 0 ? (
                <div className="mx-5 rounded-[28px] bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#697254]/10">
                    <BookmarkPlus className="h-5 w-5 text-[#697254]" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#2D2D2D]">Build a smarter buy-later list</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#92735C]/72">
                    When a scan looks promising, save it here so you can compare options before you actually buy.
                  </p>
                  <Button
                    onClick={() => router.push("/camera")}
                    className="mt-5 rounded-2xl bg-[#697254] px-5 text-[#EFE5D8] hover:bg-[#697254]/95"
                  >
                    Scan a product
                  </Button>
                </div>
              ) : (
                <div
                  className="flex gap-3 overflow-x-auto px-5 pb-1"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <AnimatePresence initial={false}>
                    {futureBuys.map((item, index) => {
                      const ratingMeta = getRatingMeta(item.rating.rating)
                      return (
                        <motion.div
                          layout
                          key={item.id}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          transition={{ duration: 0.35, delay: index * 0.04, ease }}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => setSelectedItem(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              setSelectedItem(item)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className="relative flex w-[285px] shrink-0 flex-col overflow-hidden rounded-[28px] bg-white p-4 text-left shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <Badge className={`border ${ratingMeta.badgeClass}`}>
                              <Star className="mr-1.5 h-3.5 w-3.5" />
                              {item.rating.rating}/10
                            </Badge>
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                removeFromFutureBuys(item.id, item.productName)
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#92735C]/8 text-[#92735C] transition-colors hover:bg-[#C45B4A]/10 hover:text-[#C45B4A]"
                              aria-label={`Remove ${item.productName || "saved product"}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 flex items-start gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#DBD0C4]/45">
                              <img
                                src={item.imageUrl || "/placeholder.svg"}
                                alt={item.productName || "Saved product"}
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-2 text-[15px] font-bold leading-snug text-[#2D2D2D]">
                                {item.productName || "Saved scan"}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#92735C]/70">
                                {item.rating.explanation}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3 text-[11px] font-medium text-[#92735C]/70">
                            <span className="inline-flex items-center gap-1.5">
                              <Heart className="h-3.5 w-3.5 text-[#C45B4A]" />
                              Saved {formatRelativeDate(item.addedAt)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              Open
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16, ease }}
              className="pt-7"
            >
              <div className="mb-3 flex items-end justify-between px-5">
                <div>
                  <h2 className="text-xl font-bold text-[#2D2D2D]">Last scans</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#92735C]/72">
                    Your most recent product checks, ready to compare or revisit.
                  </p>
                </div>
                <span className="rounded-full bg-[#697254]/10 px-3 py-1 text-[11px] font-semibold text-[#697254]">
                  {scanHistory.length} total
                </span>
              </div>

              {scanHistory.length === 0 ? (
                <div className="mx-5 rounded-[28px] bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A7AD89]/18">
                    <ScanLine className="h-5 w-5 text-[#697254]" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#2D2D2D]">Nothing scanned yet</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#92735C]/72">
                    Use Pickly’s scanner to start building a useful history of products worth keeping or avoiding.
                  </p>
                  <Button
                    onClick={() => router.push("/camera")}
                    className="mt-5 rounded-2xl bg-[#697254] px-5 text-[#EFE5D8] hover:bg-[#697254]/95"
                  >
                    Start scanning
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 px-5">
                  {latestScan && (
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedItem(latestScan)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setSelectedItem(latestScan)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="w-full overflow-hidden rounded-[30px] bg-white p-4 text-left shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#92735C]/55">
                            Latest scan
                          </p>
                          <h3 className="mt-1 text-xl font-bold text-[#2D2D2D]">
                            {latestScan.productName || "Scanned product"}
                          </h3>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#92735C]/70">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatFullDate(latestScan.scannedAt)}
                          </p>
                        </div>

                        <Badge className={`border ${getRatingMeta(latestScan.rating.rating).badgeClass}`}>
                          <Star className="mr-1.5 h-3.5 w-3.5" />
                          {latestScan.rating.rating}/10
                        </Badge>
                      </div>

                      <div className="mt-4 flex gap-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-[#DBD0C4]/45">
                          <img
                            src={latestScan.imageUrl || "/placeholder.svg"}
                            alt={latestScan.productName || "Latest scan"}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-3 text-[13px] leading-relaxed text-[#92735C]/76">
                            {latestScan.rating.explanation}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                saveToFutureBuys(latestScan)
                              }}
                              disabled={isSavedForLater(latestScan.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-[#697254]/10 px-3 py-1.5 text-[11px] font-semibold text-[#697254]"
                            >
                              {isSavedForLater(latestScan.id) ? (
                                <>
                                  <BookmarkCheck className="h-3.5 w-3.5" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="h-3.5 w-3.5" />
                                  Save for later
                                </>
                              )}
                            </button>
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#92735C]/8 px-3 py-1.5 text-[11px] font-semibold text-[#92735C]">
                              <ArrowRight className="h-3.5 w-3.5" />
                              Open analysis
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence initial={false}>
                    {recentScans.map((scan, index) => {
                      const ratingMeta = getRatingMeta(scan.rating.rating)
                      return (
                        <motion.div
                          layout
                          key={scan.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.3, delay: index * 0.05, ease }}
                          className="rounded-[26px] bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => setSelectedItem(scan)}
                              className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#DBD0C4]/45"
                            >
                              <img
                                src={scan.imageUrl || "/placeholder.svg"}
                                alt={scan.productName || "Scan history product"}
                                className="h-full w-full object-cover"
                              />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-[15px] font-bold text-[#2D2D2D]">
                                    {scan.productName || "Scanned product"}
                                  </p>
                                  <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[#92735C]/70">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {formatRelativeDate(scan.scannedAt)}
                                  </p>
                                </div>

                                <Badge className={`border ${ratingMeta.badgeClass}`}>
                                  <Star className="mr-1 h-3 w-3" />
                                  {scan.rating.rating}
                                </Badge>
                              </div>

                              <button onClick={() => setSelectedItem(scan)} className="mt-2 text-left">
                                <p className="line-clamp-2 text-[12px] leading-relaxed text-[#92735C]/72">
                                  {scan.rating.explanation}
                                </p>
                              </button>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  onClick={() => setSelectedItem(scan)}
                                  className="rounded-full bg-[#697254]/10 px-3 py-1.5 text-[11px] font-semibold text-[#697254]"
                                >
                                  View details
                                </button>
                                <button
                                  onClick={() => saveToFutureBuys(scan)}
                                  disabled={isSavedForLater(scan.id)}
                                  className="rounded-full bg-[#92735C]/8 px-3 py-1.5 text-[11px] font-semibold text-[#92735C]"
                                >
                                  {isSavedForLater(scan.id) ? "Saved for later" : "Save for later"}
                                </button>
                                <button
                                  onClick={() => handleDeleteScan(scan.id)}
                                  className="rounded-full bg-[#C45B4A]/10 px-3 py-1.5 text-[11px] font-semibold text-[#C45B4A]"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.section>
          </>
        )}

        <Sheet open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-[32px] border-0 bg-[#F5EFE6] px-0 pb-10 pt-0">
            {selectedItem && (
              <div>
                <div className="flex justify-center pb-1 pt-3">
                  <div className="h-1 w-10 rounded-full bg-[#92735C]/25" />
                </div>

                <SheetHeader className="px-6 pt-2 text-left">
                  <SheetTitle className="pr-10 text-2xl font-bold text-[#2D2D2D]">
                    {selectedItem.productName || "Scanned product"}
                  </SheetTitle>
                  <SheetDescription className="text-sm text-[#92735C]/72">
                    {"addedAt" in selectedItem
                      ? `Saved to future buys ${formatRelativeDate(selectedItem.addedAt)}`
                      : `Scanned ${formatRelativeDate(selectedItem.scannedAt)}`}
                  </SheetDescription>
                </SheetHeader>

                <div className="px-6 pb-24 pt-5">
                  <div className="rounded-[28px] bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-[#DBD0C4]/45">
                        <img
                          src={selectedItem.imageUrl || "/placeholder.svg"}
                          alt={selectedItem.productName || "Selected product"}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Badge className={`border ${getRatingMeta(selectedItem.rating.rating).badgeClass}`}>
                          <Star className="mr-1.5 h-3.5 w-3.5" />
                          {selectedItem.rating.rating}/10
                        </Badge>

                        <p className="mt-3 text-sm leading-relaxed text-[#92735C]/78">
                          {selectedItem.rating.explanation}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MetaCard label="Scanned on" value={formatFullDate(selectedItem.scannedAt)} />
                      <MetaCard
                        label="Saved status"
                        value={
                          "addedAt" in selectedItem
                            ? formatFullDate(selectedItem.addedAt)
                            : isSavedForLater(selectedItem.id)
                              ? "Already in future buys"
                              : "Not saved yet"
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#92735C]/55">What stands out</h3>
                    <p className="mt-3 text-sm leading-7 text-[#2D2D2D]">{selectedItem.rating.explanation}</p>
                  </div>

                  <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#92735C]/55">Recommendations</h3>
                    <div className="mt-3 space-y-3">
                      {(selectedItem.rating.recommendations?.length ? selectedItem.rating.recommendations : ["Use this scan to compare alternatives before buying."]).map(
                        (recommendation, index) => (
                          <div key={`${selectedItem.id}-${index}`} className="flex gap-3">
                            <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#697254]" />
                            <p className="text-sm leading-6 text-[#2D2D2D]">{recommendation}</p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    {"addedAt" in selectedItem ? (
                      <Button
                        onClick={() => removeFromFutureBuys(selectedItem.id, selectedItem.productName)}
                        className="h-12 rounded-2xl bg-[#697254] text-[#EFE5D8] hover:bg-[#697254]/95"
                      >
                        <BookmarkCheck className="mr-2 h-4 w-4" />
                        Remove from future buys
                      </Button>
                    ) : (
                      <Button
                        onClick={() => saveToFutureBuys(selectedItem)}
                        disabled={isSavedForLater(selectedItem.id)}
                        className="h-12 rounded-2xl bg-[#697254] text-[#EFE5D8] hover:bg-[#697254]/95"
                      >
                        {isSavedForLater(selectedItem.id) ? (
                          <>
                            <BookmarkCheck className="mr-2 h-4 w-4" />
                            Already saved to future buys
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="mr-2 h-4 w-4" />
                            Save to future buys
                          </>
                        )}
                      </Button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/camera")}
                        className="h-11 rounded-2xl border-[#DBD0C4] bg-white text-[#2D2D2D] hover:bg-[#F8F3EC]"
                      >
                        Scan again
                      </Button>
                      {!("addedAt" in selectedItem) ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteScan(selectedItem.id)}
                          className="h-11 rounded-2xl border-[#F2D7D2] bg-white text-[#C45B4A] hover:bg-[#FFF8F7]"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete scan
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedItem(null)}
                          className="h-11 rounded-2xl border-[#DBD0C4] bg-white text-[#2D2D2D] hover:bg-[#F8F3EC]"
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ProtectedRoute>
  )
}

function InsightCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-[24px] bg-white/10 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[#EFE5D8]/72">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">{icon}</div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-[#EFE5D8]/72">{helper}</p>
    </div>
  )
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8F3EC] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#92735C]/55">{label}</p>
      <p className="mt-1 text-sm font-bold leading-snug text-[#2D2D2D]">{value}</p>
    </div>
  )
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function formatRelativeDate(date: Date) {
  const value = new Date(date).getTime()
  const diffInMinutes = Math.round((Date.now() - value) / 60000)

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.round(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.round(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

function getRatingMeta(rating: number) {
  if (rating >= 8) {
    return {
      badgeClass: "bg-[#A7AD89]/18 text-[#697254] border-[#A7AD89]/40",
    }
  }

  if (rating >= 6) {
    return {
      badgeClass: "bg-[#B69C85]/16 text-[#92735C] border-[#B69C85]/35",
    }
  }

  return {
    badgeClass: "bg-[#C45B4A]/12 text-[#C45B4A] border-[#E8B8AF]",
  }
}
