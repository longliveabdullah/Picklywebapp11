import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 15

const PriceSearchBodySchema = z.object({
  scan_id: z.string().uuid().optional(),
  product_name: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  category: z.string().trim().optional().nullable(),
  full_title: z.string().trim().optional().nullable(),
})

const PriceServiceListingSchema = z.object({
  retailer: z.string(),
  price: z.number(),
  currency: z.literal("TRY"),
  product_title: z.string(),
  url: z.string(),
  confidence: z.number().optional(),
})

const retailerDisplay: Record<string, { name: string; logo: string }> = {
  akakce: { name: "Akakçe", logo: "/logos/akakce.svg" },
  trendyol: { name: "Trendyol", logo: "/logos/trendyol.svg" },
  gratis: { name: "Gratis", logo: "/logos/gratis.svg" },
  rossmann: { name: "Rossmann", logo: "/logos/rossmann.svg" },
  watsons: { name: "Watsons", logo: "/logos/watsons.svg" },
  eve: { name: "Eve", logo: "/logos/eve.svg" },
  sephora: { name: "Sephora", logo: "/logos/sephora.svg" },
}

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const requestBuckets = new Map<string, number[]>()

function isRateLimited(userId: string) {
  const now = Date.now()
  const recent = (requestBuckets.get(userId) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    requestBuckets.set(userId, recent)
    return true
  }
  recent.push(now)
  requestBuckets.set(userId, recent)
  return false
}

function insufficientProductData(productName: string | null | undefined, brand: string | null | undefined) {
  const normalizedBrand = brand?.trim().toLowerCase()
  const normalizedName = productName?.trim().toLowerCase()
  return (
    !normalizedBrand ||
    !normalizedName ||
    normalizedBrand === "unknown" ||
    normalizedName === "unknown" ||
    normalizedName.includes("unrecognized")
  )
}

export async function POST(request: NextRequest) {
  try {
    const jsonUnknown: unknown = await request.json()
    const parsedBody = PriceSearchBodySchema.safeParse(jsonUnknown)

    if (!parsedBody.success) {
      return NextResponse.json({ ok: false, listings: [], reason: "invalid_request" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, listings: [], reason: "unauthorized" }, { status: 401 })
    }

    if (isRateLimited(user.id)) {
      return NextResponse.json({ ok: false, listings: [], reason: "rate_limited" }, { status: 429 })
    }

    let productName = parsedBody.data.product_name ?? null
    let brand = parsedBody.data.brand ?? null
    let category = parsedBody.data.category ?? null
    let fullTitle = parsedBody.data.full_title ?? null

    if (parsedBody.data.scan_id) {
      const { data: scanRow, error: scanError } = await supabase
        .from("scan_history")
        .select("product_name, product_brand, product_category")
        .eq("id", parsedBody.data.scan_id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (scanError) {
        console.warn("[price-search] scan lookup failed:", scanError.message)
      }

      productName = scanRow?.product_name ?? productName
      brand = scanRow?.product_brand ?? brand
      category = scanRow?.product_category ?? category
      fullTitle = fullTitle ?? [brand, productName].filter(Boolean).join(" ")
    }

    if (insufficientProductData(productName, brand)) {
      return NextResponse.json({ ok: false, listings: [], reason: "insufficient_product_data" })
    }

    const serviceUrl = process.env.PRICE_SERVICE_URL
    if (!serviceUrl) {
      console.warn("[price-search] missing PRICE_SERVICE_URL")
      return NextResponse.json({ ok: true, listings: [], message: "unavailable" })
    }

    const serviceResponse = await fetch(`${serviceUrl.replace(/\/$/, "")}/price-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_name: productName,
        brand,
        category,
        full_title: fullTitle ?? [brand, productName].filter(Boolean).join(" "),
      }),
      signal: AbortSignal.timeout(13_000),
    })

    if (!serviceResponse.ok) {
      console.warn("[price-search] service returned:", serviceResponse.status)
      return NextResponse.json({ ok: true, listings: [], message: "unavailable" })
    }

    const parsedListings = z.array(PriceServiceListingSchema).safeParse(await serviceResponse.json())
    if (!parsedListings.success) {
      console.warn("[price-search] invalid service response:", parsedListings.error.flatten())
      return NextResponse.json({ ok: true, listings: [], message: "unavailable" })
    }

    const listings = parsedListings.data.map((listing) => {
      const display = retailerDisplay[listing.retailer] ?? {
        name: listing.retailer,
        logo: "/placeholder.svg",
      }

      return {
        retailer: listing.retailer,
        retailerName: display.name,
        retailerLogo: display.logo,
        price: listing.price,
        currency: listing.currency,
        productTitle: listing.product_title,
        url: listing.url,
      }
    })

    return NextResponse.json({ ok: true, listings })
  } catch (error) {
    console.warn("[price-search] unavailable:", error)
    return NextResponse.json({ ok: true, listings: [], message: "unavailable" })
  }
}
