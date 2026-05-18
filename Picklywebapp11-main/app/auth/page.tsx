"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, CheckCircle } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Checkbox } from "@/components/ui/checkbox"

const ACCENT = "#697254"
const formCardTransition = { type: "tween", duration: 0.6, ease: [0.22, 1, 0.36, 1] }
const AUTH_BG = "/images/auth-bg-v2.png"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export default function SignInPage() {
  const { signIn, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoBanner, setInfoBanner] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    const authError = searchParams.get("error")
    if (authError === "auth_error" || authError === "auth_failed") {
      setError("Authentication failed. Please try again.")
    } else if (authError === "callback_error") {
      setError("There was an error completing your sign in. Please try again.")
    }

    if (searchParams.get("registered") === "1") {
      setInfoBanner(
        "Check your inbox for a confirmation link if your project requires email verification. After confirming, sign in below.",
      )
    }
  }, [searchParams])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    setError(null)
    try {
      await signIn(data.email, data.password)
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${AUTH_BG})` }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EFE5D8] border-t-transparent" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${AUTH_BG})` }}
    >
      <div className="absolute inset-0 bg-black/25 pointer-events-none" aria-hidden />

      <div className="flex-1 min-h-[28vh] sm:min-h-[32vh]" />

      <motion.div
        className="relative z-10 flex-1 rounded-t-3xl bg-[#EFE5D8] shadow-[0_-8px_32px_rgba(0,0,0,0.08)] px-6 pt-8 pb-10 sm:px-8"
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={formCardTransition}
      >
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: ACCENT }}>
            Welcome!
          </h1>
          <p className="mt-1 text-[#92735C]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold hover:underline"
              style={{ color: ACCENT }}
            >
              Sign up
            </Link>
          </p>

          {infoBanner && (
            <Alert className="mt-6 border-[#697254]/30 bg-[#697254]/10 text-[#4a523a]">
              <CheckCircle className="h-4 w-4 text-[#697254]" />
              <AlertDescription>{infoBanner}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#697254]">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  autoComplete="email"
                  disabled={isLoading}
                  className="h-12 rounded-xl border-[#B69C85]/30 bg-white/60 focus:border-[#697254] focus:ring-[#697254]/20"
                  {...register("email")}
                />
                {errors.email && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                )}
                {!errors.email && watch("email") && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#697254]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="h-12 rounded-xl border-[#B69C85]/30 bg-white/60 focus:border-[#697254] focus:ring-[#697254]/20 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#92735C] hover:text-[#697254]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(!!v)}
                  className="border-[#B69C85]/50 data-[state=checked]:bg-[#697254] data-[state=checked]:border-[#697254]"
                />
                <span className="text-sm text-[#92735C]">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium hover:underline"
                style={{ color: ACCENT }}
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl text-[#EFE5D8] hover:opacity-95 transition-opacity"
              style={{ backgroundColor: ACCENT }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-[#EFE5D8] border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Sign In
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
