"use client"

import { type RoutineSelection, type SharedShelfProduct } from "@/lib/pickly-mock-data"

interface ProfileShareCardProps {
  displayName: string
  amSteps: RoutineSelection[]
  pmSteps: RoutineSelection[]
  products: SharedShelfProduct[]
}

export function ProfileShareCard({
  displayName,
  amSteps,
  pmSteps,
  products,
}: ProfileShareCardProps) {
  const resolveProduct = (productId: string) => products.find((product) => product.id === productId)

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#697254] p-5 text-[#EFE5D8] shadow-lg">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#A7AD89]/15" />
      <div className="absolute -bottom-10 left-[-20px] h-28 w-28 rounded-full bg-white/5" />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A7AD89]">Curated with Pickly</p>
            <h3 className="mt-2 text-xl font-bold">{displayName}'s Routine</h3>
            <p className="mt-1 max-w-[220px] text-[12px] leading-relaxed text-[#EFE5D8]/75">
              A simple routine built with products that actually fit.
            </p>
          </div>

          <div className="rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide">
            Shareable
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#A7AD89]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A7AD89]">Morning Routine</p>
            </div>
            <div className="space-y-2">
              {amSteps.slice(0, 4).map((step, index) => (
                <div key={step.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/12 text-[10px] font-bold text-[#EFE5D8]/85">
                    {index + 1}
                  </span>
                  <p className="text-[12px] leading-snug text-[#EFE5D8]/88">
                    {resolveProduct(step.productId)?.product_name ?? "Choose product"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#B69C85]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#EFE5D8]/75">Night Routine</p>
            </div>
            <div className="space-y-2">
              {pmSteps.slice(0, 4).map((step, index) => (
                <div key={step.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/12 text-[10px] font-bold text-[#EFE5D8]/85">
                    {index + 1}
                  </span>
                  <p className="text-[12px] leading-snug text-[#EFE5D8]/88">
                    {resolveProduct(step.productId)?.product_name ?? "Choose product"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
