"use client"

import { useCallback, useEffect, useState } from "react"
import { cloneDefaultRoutine, type RoutinePeriod, type RoutineSelection, type RoutineType } from "@/lib/pickly-mock-data"
import { useSharedShelf } from "@/hooks/use-shared-shelf"

const ROUTINE_STORAGE_KEY = "pickly-shared-routine"

type SharedRoutine = {
  am: RoutineSelection[]
  pm: RoutineSelection[]
}

export function useSharedRoutine() {
  const [routine, setRoutine] = useState<SharedRoutine>(() => cloneDefaultRoutine())
  const { products } = useSharedShelf()

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ROUTINE_STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as SharedRoutine
      if (parsed?.am && parsed?.pm) {
        setRoutine(parsed)
      }
    } catch {
      // Ignore invalid local storage and fall back to defaults.
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routine))
  }, [routine])

  const changeStepProduct = useCallback((period: RoutinePeriod, stepId: string, productId: string) => {
    setRoutine((current) => ({
      ...current,
      [period]: current[period].map((step) => (step.id === stepId ? { ...step, productId } : step)),
    }))
  }, [])

  const addStep = useCallback((period: RoutinePeriod, type: RoutineType) => {
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
  }, [products])

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
