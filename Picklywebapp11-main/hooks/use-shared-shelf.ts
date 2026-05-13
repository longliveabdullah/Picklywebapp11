"use client"

import { useCallback, useEffect, useState } from "react"
import {
  type FragranceMoment,
  shelfProducts as defaultShelfProducts,
  type RoutineType,
  type SharedShelfProduct,
  type ShelfCategory,
} from "@/lib/pickly-mock-data"

const SHELF_STORAGE_KEY = "pickly-shared-shelf"

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

const categoryTagMap: Record<ShelfCategory, string> = {
  skin: "CLEAN PICK",
  makeup: "SIGNATURE LOOK",
  hair: "SELF-CARE",
  body: "DAILY ESSENTIAL",
  fragrance: "SCENT MOOD",
}

const categoryIconMap: Record<ShelfCategory, string> = {
  skin: "✨",
  makeup: "💄",
  hair: "💆",
  body: "🫧",
  fragrance: "🌸",
}

const categoryScoreMap: Record<ShelfCategory, number> = {
  skin: 88,
  makeup: 79,
  hair: 83,
  body: 84,
  fragrance: 76,
}

function cloneProducts(products: SharedShelfProduct[]) {
  return products.map((product) => ({ ...product }))
}

export function useSharedShelf() {
  const [products, setProducts] = useState<SharedShelfProduct[]>(() => cloneProducts(defaultShelfProducts))

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SHELF_STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as SharedShelfProduct[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setProducts(parsed)
      }
    } catch {
      // Fall back to the default frontend seed data.
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(SHELF_STORAGE_KEY, JSON.stringify(products))
  }, [products])

  const addProduct = useCallback((input: NewShelfProductInput) => {
    const newProduct: SharedShelfProduct = {
      id: `shelf-${Date.now()}`,
      product_name: input.product_name.trim(),
      brand: input.brand.trim(),
      category: input.category,
      routine_type: input.routine_type,
      fragrance_moment: input.fragrance_moment,
      expiry_date: input.expiry_date,
      period_after_opening: input.period_after_opening,
      status: input.status,
      opened_date: input.status === "opened" ? input.purchase_date : null,
      created_at: input.purchase_date,
      purchase_price: input.purchase_price,
      purchase_date: input.purchase_date,
      tag: categoryTagMap[input.category],
      icon: categoryIconMap[input.category],
      clean_score: categoryScoreMap[input.category],
    }

    setProducts((current) => [newProduct, ...current])
    return newProduct
  }, [])

  return {
    products,
    addProduct,
    setProducts,
  }
}
