"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

const ease = [0.22, 1, 0.36, 1] as const

const categoryMeta: Record<string, { accent: string; label: string }> = {
  skin:      { accent: "#A7AD89", label: "Skincare" },
  makeup:    { accent: "#B69C85", label: "Makeup" },
  hair:      { accent: "#8C916C", label: "Haircare" },
  body:      { accent: "#DBD0C4", label: "Body" },
  fragrance: { accent: "#92735C", label: "Fragrance" },
}

interface ShelfProduct {
  id: string
  product_name: string
  brand: string
  category: string
  expiry_date: string | null
  period_after_opening: number | null
  status: "sealed" | "opened"
  opened_date: string | null
  created_at: string
}

const shelfProducts: ShelfProduct[] = [
  { id: "1", product_name: "Vitamin C Serum", brand: "The Ordinary", category: "skin", expiry_date: "2026-11-15", period_after_opening: 6, status: "opened", opened_date: "2026-04-01", created_at: "2026-03-20" },
  { id: "2", product_name: "Matte Lipstick", brand: "MAC", category: "makeup", expiry_date: "2027-03-01", period_after_opening: 18, status: "sealed", opened_date: null, created_at: "2026-04-10" },
  { id: "3", product_name: "Argan Oil Mask", brand: "Moroccanoil", category: "hair", expiry_date: "2026-06-10", period_after_opening: 12, status: "opened", opened_date: "2026-01-15", created_at: "2026-01-10" },
  { id: "4", product_name: "Sauvage EDT", brand: "Dior", category: "fragrance", expiry_date: null, period_after_opening: null, status: "sealed", opened_date: null, created_at: "2026-05-01" },
]

function getProductStatus(product: ShelfProduct) {
  if (!product.expiry_date) return { label: "Fresh", color: "#A7AD89", bg: "bg-[#A7AD89]/15" }
  const days = Math.ceil((new Date(product.expiry_date).getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: "Expired", color: "#C45B4A", bg: "bg-red-50" }
  if (days <= 30) return { label: "Expires Soon", color: "#B69C85", bg: "bg-[#B69C85]/15" }
  return { label: "Fresh", color: "#A7AD89", bg: "bg-[#A7AD89]/15" }
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const sampleReviews = [
  {
    id: "1",
    title: "Sephora Advent Calendar Reveal",
    description: "Is it worth the hype? We break down every ingredient inside this year's...",
    image: "/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png",
    verified: true,
  },
  {
    id: "2",
    title: "Bakuchiol vs Retinol: Worth It?",
    description: "The natural alternative that's trending in clean beauty circles...",
    image: "/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png",
    verified: true,
  },
  {
    id: "3",
    title: "Top 5 SPF Picks for Summer",
    description: "Dermatologist-approved sunscreens that won't leave a white cast...",
    image: "/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png",
    verified: false,
  },
]

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [previewProduct, setPreviewProduct] = useState<ShelfProduct | null>(null)

  const displayName = user?.name
    ? user.name.split(" ")[0]
    : `User_${user?.id?.slice(0, 5) ?? "guest"}`

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
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#697254]">
            {user?.avatar ? (
              <Image src={user.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-[#EFE5D8]">
                {displayName[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[#2D2D2D]">
              Hi, {displayName}!
            </p>
          </div>

          {/* PRO badge */}
          <button
            onClick={() => router.push("/premium")}
            className="flex items-center gap-1 rounded-full bg-[#F5D860]/20 px-2.5 py-1"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#D4A017">
              <path d="M8 0l2.2 5.5H16l-4.7 3.8 1.8 5.7L8 11.5 2.9 15l1.8-5.7L0 5.5h5.8z"/>
            </svg>
            <span className="text-xs font-bold text-[#B8860B]">PRO</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => router.push("/profile")}
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

            {/* Search Card — Cream */}
            <button
              onClick={() => router.push("/products")}
              className="flex w-[145px] shrink-0 flex-col items-center justify-start rounded-2xl bg-[#DBD0C4]/50 px-4 pb-5 pt-5 text-center transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#DBD0C4]/60">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <p className="text-[14px] font-bold text-[#2D2D2D]">Search</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#92735C]/70">
                Look up over 20,000 skincare products.
              </p>
            </button>

            {/* Pickly Wallet Card — Sand */}
            <button
              onClick={() => router.push("/history")}
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
            {shelfProducts.map((product) => {
              const meta = categoryMeta[product.category] || categoryMeta.skin
              const ps = getProductStatus(product)
              return (
                <div
                  key={product.id}
                  onClick={() => setPreviewProduct(product)}
                  className="flex w-[155px] shrink-0 cursor-pointer flex-col rounded-2xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
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
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: `${meta.accent}18`, color: meta.accent }}
                    >
                      {meta.label}
                    </span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ps.bg}`} style={{ color: ps.color }}>
                      {ps.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Product Reviews Section */}
        <div className="pt-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease }}
            className="mb-3 flex items-center justify-between px-5"
          >
            <h2 className="text-xl font-bold text-[#2D2D2D]">Product Reviews</h2>
            <button className="text-sm font-semibold text-[#697254]">
              See All
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
            className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sampleReviews.map((review) => (
              <button
                key={review.id}
                className="w-[200px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image */}
                <div className="relative h-[120px] w-full overflow-hidden bg-[#E8E2D8]">
                  <Image
                    src={review.image}
                    alt={review.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="p-3 text-left">
                  <p className="mb-1 text-[13px] font-bold leading-snug text-[#2D2D2D]">
                    {review.title}
                  </p>
                  <p className="mb-2.5 line-clamp-2 text-[11px] leading-snug text-[#92735C]/80">
                    {review.description}
                  </p>

                  <div className="flex items-center justify-between">
                    {/* Author dots */}
                    <div className="flex -space-x-1.5">
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className="h-5 w-5 rounded-full border-2 border-white"
                          style={{ backgroundColor: i === 0 ? "#697254" : "#A7AD89" }}
                        />
                      ))}
                    </div>

                    {review.verified && (
                      <span className="rounded-md bg-[#A7AD89]/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#697254]">
                        VERIFIED
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
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
      </div>
    </ProtectedRoute>
  )
}
