"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { cloneDefaultRoutine, type RoutinePeriod, type RoutineSelection, type RoutineType } from "@/lib/pickly-mock-data"
import type { SharedShelfProduct } from "@/lib/shelf-types"
import { useSharedShelf } from "@/hooks/use-shared-shelf"

const ROUTINE_STORAGE_KEY = "pickly-shared-routine"

type SharedRoutine = {
  am: RoutineSelection[]
  pm: RoutineSelection[]
}

function remapRoutineToValidProducts(
  routine: SharedRoutine,
  products: { id: string; routine_type?: string }[],
): SharedRoutine {
  if (products.length === 0) return { am: [], pm: [] }
  const validIds = new Set(products.map((p) => p.id))
  const fallbackFor = (step: RoutineSelection) => {
    const byType = products.find((p) => p.routine_type === step.type)?.id
    return byType ?? products[0]!.id
  }
  const fixStep = (step: RoutineSelection): RoutineSelection => {
    if (validIds.has(step.productId)) return step
    return { ...step, productId: fallbackFor(step) }
  }
  return {
    am: routine.am.map(fixStep),
    pm: routine.pm.map(fixStep),
  }
}

/**
 * Use the same `products` / `shelfReady` instance as `useSharedShelf()` on that screen
 * so routine steps and dropdowns stay aligned with the shelf (e.g. home page).
 */
export function useSharedRoutineWithProducts(products: SharedShelfProduct[], shelfReady: boolean) {
  const { user } = useAuth()
  const [routine, setRoutine] = useState<SharedRoutine>(() => cloneDefaultRoutine())
  const didHydrateFromStorage = useRef(false)

  useEffect(() => {
    didHydrateFromStorage.current = false
  }, [user?.id])

  useEffect(() => {
    if (!shelfReady) return

    if (products.length === 0) {
      setRoutine({ am: [], pm: [] })
      didHydrateFromStorage.current = false
      return
    }

    if (!didHydrateFromStorage.current) {
      didHydrateFromStorage.current = true
      try {
        const stored = window.localStorage.getItem(ROUTINE_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as SharedRoutine
          if (parsed?.am && parsed?.pm) {
            setRoutine(remapRoutineToValidProducts(parsed, products))
            return
          }
        }
      } catch {
        // fall through
      }
    }

    setRoutine((current) => remapRoutineToValidProducts(current, products))
  }, [products, shelfReady])

  useEffect(() => {
    window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routine))
  }, [routine])

  const changeStepProduct = useCallback((period: RoutinePeriod, stepId: string, productId: string) => {
    setRoutine((current) => ({
      ...current,
      [period]: current[period].map((step) => (step.id === stepId ? { ...step, productId } : step)),
    }))
  }, [])

  const addStep = useCallback(
    (period: RoutinePeriod, type: RoutineType) => {
      const fallbackProduct = products.find((product) => product.routine_type === type)?.id ?? products[0]?.id
      if (!fallbackProduct) return

      setRoutine((current) => ({
        ...current,
        [period]: [
          ...current[period],
          {
            id: `${period}-${type}-${Date.now()}`,
            type,
            productId: fallbackProduct,
            note: `Added from your shelf for your ${period.toUpperCase()} routine.`,
          },
        ],
      }))
    },
    [products],
  )

  const removeStep = useCallback((period: RoutinePeriod, stepId: string) => {
    setRoutine((current) => ({
      ...current,
      [period]: current[period].filter((step) => step.id !== stepId),
    }))
  }, [])

  return {
    routine,
    changeStepProduct,
    addStep,
    removeStep,
  }
}

/** Loads shelf internally. Prefer `useSharedRoutineWithProducts` when the page already calls `useSharedShelf()`. */
export function useSharedRoutine() {
  const { products, shelfReady } = useSharedShelf()
  return useSharedRoutineWithProducts(products, shelfReady)
}
