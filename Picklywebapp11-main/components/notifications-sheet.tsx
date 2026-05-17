"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type NotificationsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBuildRoutine?: () => void
  hasRoutine?: boolean
}

export function NotificationsSheet({
  open,
  onOpenChange,
  onBuildRoutine,
  hasRoutine = false,
}: NotificationsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#F5EFE6] pb-10">
        <SheetHeader className="mb-5 text-left">
          <SheetTitle className="text-lg font-bold text-[#2D2D2D]">Notifications</SheetTitle>
        </SheetHeader>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#697254]/10">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>

          {hasRoutine ? (
            <>
              <p className="text-[15px] font-bold leading-snug text-[#2D2D2D]">
                Your reminders are getting personal
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#92735C]/80">
                We&apos;ll send friendly daily nudges based on your AM and PM routine — gentle check-ins, not noisy alerts.
              </p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-bold leading-snug text-[#2D2D2D]">
                 Your daily reminders
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#92735C]/80">
                Add your routine so we can tailor gentle daily reminders to your AM and PM steps.
              </p>
            </>
          )}

          {onBuildRoutine && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false)
                onBuildRoutine()
              }}
              className="mt-5 w-full rounded-2xl bg-[#697254] py-3.5 text-center text-sm font-semibold text-[#EFE5D8] shadow-md transition-shadow hover:shadow-lg"
            >
              {hasRoutine ? "View my routine" : "Add my routine"}
            </button>
          )}
        </div>

        <p className="mt-4 px-1 text-center text-[11px] leading-relaxed text-[#92735C]/60">
          Product expiry alerts and shelf updates will show up here soon.
        </p>
      </SheetContent>
    </Sheet>
  )
}
