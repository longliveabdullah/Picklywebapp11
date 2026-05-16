"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { DatabaseService } from "@/lib/database-service"
import type { FragranceMoment, RoutineType, SharedShelfProduct, ShelfCategory } from "@/lib/pickly-mock-data"
import { userProductRowToShared } from "@/lib/user-product-mapper"

/** Legacy one-time migration from old client-only shelf storage to Supabase. */
const SHELF_LEGACY_STORAGE_KEY = "pickly-shared-shelf"

function shelfMigratedKey(userId: string) {
  return `pickly-shelf-db-sync-v1-${userId}`
}

type NewShelfProductInput = {
  product_name: string
  brand: string
  category: ShelfCategory
  expiry_date: string | null
  period_after_opening: number | null
  status: "sealed" | "opened"
  purchase_price: number
  purchase_date: string
  routine_type?: RoutineType
  fragrance_moment?: FragranceMoment
}

export function useSharedShelf() {
  const { user } = useAuth()
  const [products, setProducts] = useState<SharedShelfProduct[]>([])
  const [shelfReady, setShelfReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadAuthed = async (userId: string) => {
      try {
        const rows = await DatabaseService.getUserProducts(userId)
        if (cancelled) return

        if (rows.length > 0) {
          setProducts(rows.map(userProductRowToShared))
          setShelfReady(true)
          return
        }

        if (typeof window !== "undefined" && !localStorage.getItem(shelfMigratedKey(userId))) {
          try {
            const raw = localStorage.getItem(SHELF_LEGACY_STORAGE_KEY)
            if (raw) {
              const parsed = JSON.parse(raw) as SharedShelfProduct[]
              if (Array.isArray(parsed) && parsed.length > 0) {
                for (const p of parsed) {
                  await DatabaseService.insertUserProduct(userId, {
                    product_name: p.product_name,
                    brand: p.brand,
                    category: p.category,
                    expiry_date: p.expiry_date,
                    period_after_opening: p.period_after_opening,
                    status: p.status,
                    purchase_price: p.purchase_price,
                    purchase_date: p.purchase_date,
                    routine_type: p.routine_type,
                    fragrance_moment: p.fragrance_moment,
                  })
                }
                localStorage.setItem(shelfMigratedKey(userId), "1")
                try {
                  localStorage.removeItem(SHELF_LEGACY_STORAGE_KEY)
                } catch {
                  // ignore
                }
                const again = await DatabaseService.getUserProducts(userId)
                if (cancelled) return
                setProducts(again.map(userProductRowToShared))
                setShelfReady(true)
                return
              }
            }
          } catch (e) {
            console.error("Shelf migration failed:", e)
          }
          localStorage.setItem(shelfMigratedKey(userId), "1")
        }

        setProducts([])
        setShelfReady(true)
      } catch (e) {
        console.error("Failed to load shelf from Supabase:", e)
        if (!cancelled) {
          setProducts([])
          setShelfReady(true)
        }
      }
    }

    setShelfReady(false)

    if (user?.id) {
      void loadAuthed(user.id)
    } else {
      setProducts([])
      setShelfReady(true)
    }

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const addProduct = useCallback(
    async (input: NewShelfProductInput): Promise<SharedShelfProduct> => {
      if (!user?.id) {
        throw new Error("Sign in to save products to your shelf.")
      }
      const row = await DatabaseService.insertUserProduct(user.id, input)
      const product = userProductRowToShared(row)
      setProducts((current) => [product, ...current])
      return product
    },
    [user?.id],
  )

  return {
    products,
    addProduct,
    shelfReady,
  }
}
