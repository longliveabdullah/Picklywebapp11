"use client"

import { useMemo, useState } from "react"
import { ArrowRight, RefreshCw, ShoppingBag } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type PriceListing = {
  retailer: string
  retailerName: string
  retailerLogo: string
  price: number
  currency: "TRY"
  productTitle: string
  url: string
}

type PriceSearchProps = {
  productName: string
  brand: string
  category?: string
  fullTitle?: string
  locale?: "en" | "tr"
}

type State = "idle" | "loading" | "success" | "empty"

const copy = {
  en: {
    eyebrow: "Best price finder",
    title: "Find the cheapest live listing",
    body: "Pickly checks Akakçe plus Watsons, Gratis, Rossmann, Trendyol, Eve, and Sephora for this exact product.",
    button: "Find best price",
    loading: "Checking 7 sources...",
    goToStore: "Go to store",
    empty: "Couldn't find this product right now.",
    retry: "Try again",
  },
  tr: {
    eyebrow: "En uygun fiyat",
    title: "Canlı en ucuz ilanı bul",
    body: "Pickly bu ürün için Akakçe ile Watsons, Gratis, Rossmann, Trendyol, Eve ve Sephora'yı kontrol eder.",
    button: "En uygun fiyatı bul",
    loading: "7 kaynak kontrol ediliyor...",
    goToStore: "Mağazaya git",
    empty: "Bu ürün şu an bu mağazalarda bulunamadı.",
    retry: "Tekrar dene",
  },
}

function formatTry(price: number, locale: "en" | "tr") {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(price)
}

export function PriceSearch({ productName, brand, category, fullTitle, locale = "en" }: PriceSearchProps) {
  const [state, setState] = useState<State>("idle")
  const [listings, setListings] = useState<PriceListing[]>([])
  const text = copy[locale]

  const requestPayload = useMemo(
    () => ({
      product_name: productName,
      brand,
      category,
      full_title: fullTitle ?? `${brand} ${productName}`.trim(),
    }),
    [brand, category, fullTitle, productName],
  )

  async function runSearch() {
    setState("loading")
    try {
      const response = await fetch("/api/price-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        setListings([])
        setState("empty")
        return
      }

      const payload = (await response.json()) as { ok?: boolean; listings?: PriceListing[] }
      const nextListings = Array.isArray(payload.listings) ? payload.listings.slice(0, 8) : []
      setListings(nextListings)
      setState(nextListings.length > 0 ? "success" : "empty")
    } catch {
      setListings([])
      setState("empty")
    }
  }

  return (
    <Card className="rounded-[28px] border-[#E8DDD2] bg-white shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#697254]/10">
            <ShoppingBag className="h-5 w-5 text-[#697254]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#92735C]/55">{text.eyebrow}</p>
            <h2 className="mt-1 text-lg font-bold text-[#2D2D2D]">{text.title}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6B6257]">{text.body}</p>
          </div>
        </div>

        {state === "idle" && (
          <Button type="button" onClick={() => void runSearch()} className="mt-5 h-12 w-full rounded-2xl bg-[#697254] text-white hover:bg-[#596247]">
            {text.button}
          </Button>
        )}

        {state === "loading" && (
          <div className="mt-5 space-y-3">
            <p className="text-[13px] font-semibold text-[#6B6257]">{text.loading}</p>
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#E8DDD2] bg-[#FCF8F3] p-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-[#E8DDD2]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#E8DDD2]" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#EFE5DA]" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-full bg-[#E8DDD2]" />
              </div>
            ))}
          </div>
        )}

        {state === "success" && (
          <div className="mt-5 space-y-3">
            {listings.map((listing) => (
              <div key={`${listing.retailer}-${listing.url}`} className="rounded-2xl border border-[#E8DDD2] bg-[#FCF8F3] p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={listing.retailerLogo}
                    alt={listing.retailerName}
                    className="h-10 w-10 rounded-xl bg-white object-contain p-1"
                    onError={(event) => {
                      event.currentTarget.style.display = "none"
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#2D2D2D]">{listing.retailerName}</p>
                      <p className="text-sm font-bold text-[#697254]">{formatTry(listing.price, locale)}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#6B6257]">{listing.productTitle}</p>
                  </div>
                  <Button asChild size="sm" className="shrink-0 rounded-xl bg-[#2D2D2D] text-white hover:bg-[#1F1F1F]">
                    <a href={listing.url} target="_blank" rel="noreferrer">
                      <span className="hidden sm:inline">{text.goToStore}</span>
                      <ArrowRight className="h-4 w-4 sm:ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {state === "empty" && (
          <div className="mt-5 rounded-2xl border border-[#E8DDD2] bg-[#FCF8F3] p-4 text-center">
            <p className="text-sm font-semibold text-[#6B6257]">{text.empty}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void runSearch()}
              className="mt-3 rounded-xl border-[#D9CBBF] text-[#5F554C]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {text.retry}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
