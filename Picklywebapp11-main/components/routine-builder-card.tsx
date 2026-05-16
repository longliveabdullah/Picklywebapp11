"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getRoutineProductOptions,
  routineTypeMeta,
  type RoutinePeriod,
  type RoutineSelection,
  type RoutineType,
  type SharedShelfProduct,
} from "@/lib/pickly-mock-data"

interface RoutineBuilderCardProps {
  period: RoutinePeriod
  steps: RoutineSelection[]
  products: SharedShelfProduct[]
  onPeriodChange: (period: RoutinePeriod) => void
  onChangeStepProduct: (stepId: string, productId: string) => void
  onAddStep: (type: RoutineType) => void
  onRemoveStep: (stepId: string) => void
}

const stepOrder: RoutineType[] = ["cleanser", "serum", "treatment", "moisturizer", "spf", "oil"]

export function RoutineBuilderCard({
  period,
  steps,
  products,
  onPeriodChange,
  onChangeStepProduct,
  onAddStep,
  onRemoveStep,
}: RoutineBuilderCardProps) {
  const usedTypes = new Set(steps.map((step) => step.type))
  const addableTypes = stepOrder.filter((type) => !usedTypes.has(type))

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-[#2D2D2D]">Build My Routine</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#92735C]/65">
            Every step is powered by products already saved in your shelf.
          </p>
        </div>
        <div className="flex rounded-full bg-[#F5EFE6] p-1">
          {(["am", "pm"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPeriodChange(value)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                period === value ? "bg-[#697254] text-[#EFE5D8]" : "text-[#92735C]/60"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const options = getRoutineProductOptions(products, step.type)
          const valueInOptions = options.some((p) => p.id === step.productId)
          const selectValue = valueInOptions ? step.productId : (options[0]?.id ?? "")

          return (
            <div key={step.id} className="rounded-2xl bg-[#F5EFE6] p-3.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#697254]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-[#2D2D2D]">
                      {routineTypeMeta[step.type].label}
                    </p>
                    <p className="text-[10px] text-[#92735C]/55">{step.note}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveStep(step.id)}
                  className="text-[10px] font-semibold uppercase tracking-wide text-[#92735C]/60"
                >
                  Remove
                </button>
              </div>

              {options.length === 0 ? (
                <p className="rounded-xl bg-white/80 px-3 py-2.5 text-[11px] leading-snug text-[#92735C]/80">
                  Add a product in this category to your shelf, then pick it here.
                </p>
              ) : (
                <Select
                  value={selectValue}
                  onValueChange={(value) => onChangeStepProduct(step.id, value)}
                >
                  <SelectTrigger className="border-0 bg-white text-left shadow-none">
                    <SelectValue placeholder={`Choose ${routineTypeMeta[step.type].label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.product_name} · {product.brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )
        })}
      </div>

      {addableTypes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {addableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onAddStep(type)}
              className="rounded-full bg-[#697254]/10 px-3 py-1.5 text-[11px] font-semibold text-[#697254] transition-colors hover:bg-[#697254]/15"
            >
              + Add {routineTypeMeta[type].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
