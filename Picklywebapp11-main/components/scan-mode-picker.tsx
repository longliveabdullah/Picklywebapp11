"use client"

import type React from "react"
import { useState } from "react"
import { Check, Info, Layers3, ShoppingBag } from "@/lib/icons"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { resultModeOptions, type ResultMode, type ScanModeInfo } from "@/lib/scan-result-view-model"
import { cn } from "@/lib/utils"

const modeIcons: Record<ResultMode, React.ReactNode> = {
  in_store: <ShoppingBag className="h-5 w-5" />,
  researching: <Layers3 className="h-5 w-5" />,
}

const modeTheme: Record<
  ResultMode,
  {
    accent: string
    accentSoft: string
    accentMuted: string
    heroGradient: string
    checkBg: string
  }
> = {
  in_store: {
    accent: "#697254",
    accentSoft: "#EEF2E5",
    accentMuted: "#8A9478",
    heroGradient: "linear-gradient(165deg, #F8FAF4 0%, #FFFFFF 55%, #F5EFE6 100%)",
    checkBg: "#697254",
  },
  researching: {
    accent: "#92735C",
    accentSoft: "#F7EDE4",
    accentMuted: "#A8846E",
    heroGradient: "linear-gradient(165deg, #FBF6F1 0%, #FFFFFF 55%, #F5EFE6 100%)",
    checkBg: "#92735C",
  },
}

type ScanModePickerProps = {
  value: ResultMode
  onChange: (mode: ResultMode) => void
  variant?: "pre-scan" | "result"
}

export function ScanModePicker({ value, onChange, variant = "pre-scan" }: ScanModePickerProps) {
  const [infoMode, setInfoMode] = useState<ResultMode | null>(null)
  const activeOption = resultModeOptions.find((option) => option.id === infoMode)
  const isPreScan = variant === "pre-scan"

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {resultModeOptions.map((option) => {
          const isActive = value === option.id
          return (
            <div key={option.id} className="relative">
              <button
                type="button"
                onClick={() => onChange(option.id)}
                className={cn(
                  "flex w-full flex-col rounded-2xl border px-3 py-3.5 pr-10 text-left transition-all",
                  isPreScan
                    ? isActive
                      ? "border-white/35 bg-white text-[#2D2D2D] shadow-sm"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : isActive
                      ? "border-[#697254]/25 bg-white text-[#2D2D2D] shadow-sm ring-1 ring-[#697254]/10"
                      : "border-[#E8DDD2] bg-white/70 text-[#2D2D2D] hover:bg-white",
                )}
              >
                <div
                  className={cn(
                    "mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl",
                    isPreScan
                      ? isActive
                        ? "bg-[#697254]/12 text-[#697254]"
                        : "bg-white/10 text-white"
                      : isActive
                        ? "bg-[#697254]/12 text-[#697254]"
                        : "bg-[#F5EFE6] text-[#92735C]",
                  )}
                >
                  {modeIcons[option.id]}
                </div>
                <p className="text-[13px] font-bold leading-tight">{option.label}</p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    isPreScan
                      ? isActive
                        ? "text-[#92735C]"
                        : "text-white/50"
                      : isActive
                        ? "text-[#92735C]"
                        : "text-[#92735C]/55",
                  )}
                >
                  {option.tagline}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-[11px] leading-snug",
                    isPreScan ? (isActive ? "text-[#6B6257]" : "text-white/65") : "text-[#6B6257]",
                  )}
                >
                  {option.description}
                </p>
              </button>

              <ScanModeInfoTrigger variant={variant} isActive={isActive} onOpen={() => setInfoMode(option.id)} />
            </div>
          )
        })}
      </div>

      <ScanModeInfoDialog
        mode={activeOption?.id}
        info={activeOption?.info}
        open={infoMode !== null}
        onOpenChange={(open) => !open && setInfoMode(null)}
      />
    </>
  )
}

function ScanModeInfoTrigger({
  variant,
  isActive,
  onOpen,
}: {
  variant: "pre-scan" | "result"
  isActive: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        variant === "pre-scan"
          ? isActive
            ? "bg-[#697254]/10 text-[#697254] hover:bg-[#697254]/15"
            : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
          : "bg-[#F5EFE6] text-[#697254] hover:bg-[#697254]/10",
      )}
      aria-label="Learn about this Pickly mode"
    >
      <Info className="h-3.5 w-3.5" />
    </button>
  )
}

function ScanModeInfoDialog({
  mode,
  info,
  open,
  onOpenChange,
}: {
  mode?: ResultMode
  info?: ScanModeInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!info || !mode) return null

  const theme = modeTheme[mode]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-[24px] border border-[#E6DDD2] bg-white p-0 shadow-xl sm:max-w-[400px] [&>button]:right-4 [&>button]:top-4 [&>button]:rounded-full [&>button]:border [&>button]:border-[#E8DDD2] [&>button]:bg-white [&>button]:opacity-100">
        {/* Hero */}
        <div className="px-6 pb-5 pt-7" style={{ background: theme.heroGradient }}>
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
            >
              {mode === "in_store" ? <ShoppingBag className="h-7 w-7" /> : <Layers3 className="h-7 w-7" />}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: theme.accentMuted }}
              >
                {info.tagline}
              </p>
              <h2 className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-[#1F1F1F]">{info.title}</h2>
            </div>
          </div>
          <p className="mt-4 text-[14px] leading-[1.55] text-[#5C5C5C]">{info.headline}</p>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          <section>
            <SectionLabel accent={theme.accent}>Best for</SectionLabel>
            <p className="mt-2.5 rounded-xl border border-[#EFEFEF] bg-[#FAFAF8] px-4 py-3.5 text-[14px] leading-[1.55] text-[#2D2D2D]">
              {info.bestFor}
            </p>
          </section>

          <section>
            <SectionLabel accent={theme.accent}>What&apos;s included</SectionLabel>
            <ul className="mt-2.5 divide-y divide-[#F0EBE4] overflow-hidden rounded-xl border border-[#EFEFEF]">
              {info.includes.map((item) => (
                <li key={item} className="flex items-start gap-3 bg-white px-4 py-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.checkBg }}
                  >
                    <Check className="h-3 w-3 stroke-[2.5] text-white" />
                  </span>
                  <span className="text-[13px] leading-[1.5] text-[#3D3D3D]">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionLabel accent={theme.accent}>Purpose</SectionLabel>
            <p className="mt-2.5 text-[13px] leading-[1.6] text-[#5C5C5C]">{info.purpose}</p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[#F0EBE4] bg-[#FAF8F5] px-6 py-4">
          <p className="text-center text-[12px] leading-[1.5] text-[#8A847C]">{info.footnote}</p>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-4 h-11 w-full rounded-xl text-[14px] font-semibold"
            style={{ backgroundColor: theme.accent, color: "#FAFAF7" }}
          >
            Got it
          </Button>
          <p className="mt-3 text-center text-[11px] text-[#A39E96]">
            Neither mode is better — Pickly adapts to how you shop.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SectionLabel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-4 w-0.5 rounded-full" style={{ backgroundColor: accent }} />
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1F1F1F]">{children}</h3>
    </div>
  )
}
