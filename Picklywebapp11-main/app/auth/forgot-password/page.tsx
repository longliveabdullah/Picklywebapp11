"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

const APP_GRADIENT = "linear-gradient(to bottom, #9333ea 0%, #7e22ce 35%, #5b21b6 70%, #3b82f6 100%)"
const ACCENT = "#9333ea"

export default function ForgotPasswordPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: APP_GRADIENT }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute top-[25%] right-[15%] w-24 h-24 rounded-full bg-white/15" />
      </div>
      <div className="flex-1 min-h-[32vh]" />
      <div className="relative z-10 flex-1 rounded-t-3xl bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.08)] px-6 pt-8 pb-10">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold" style={{ color: ACCENT }}>
            Forgot password?
          </h1>
          <p className="mt-2 text-gray-600">
            Password reset is not set up yet. Please contact support or try signing in again.
          </p>
          <Button
            asChild
            className="mt-6 w-full h-12 rounded-xl font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            <Link href="/auth">Back to Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
