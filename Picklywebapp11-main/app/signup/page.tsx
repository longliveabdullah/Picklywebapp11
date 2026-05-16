"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

const ACCENT = "#697254"
const formCardTransition = { type: "tween", duration: 0.6, ease: [0.22, 1, 0.36, 1] }
const AUTH_BG = "/images/auth-bg-v2.png"

const formSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export default function SignUpPage() {
  const { signUp, loading } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      confirmPassword: "",
    },
  })

  const password = watch("password")

  useEffect(() => {
    let strength = 0
    if (password) {
      if (password.length >= 6) strength += 1
      if (password.length >= 8) strength += 1
      if (/[A-Z]/.test(password)) strength += 1
      if (/[0-9]/.test(password)) strength += 1
      if (/[^A-Za-z0-9]/.test(password)) strength += 1
    }
    setPasswordStrength(strength)
  }, [password])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    setError(null)
    try {
      await signUp(data.email, data.password)
      toast({
        title: "Account Created!",
        description: "Welcome to Pickly! Let's set up your profile.",
      })
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500"
    if (passwordStrength <= 2) return "bg-orange-500"
    if (passwordStrength <= 3) return "bg-yellow-500"
    if (passwordStrength <= 4) return "bg-blue-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak"
    if (passwordStrength <= 2) return "Fair"
    if (passwordStrength <= 3) return "Good"
    if (passwordStrength <= 4) return "Strong"
    return "Very Strong"
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
            Get Started!
          </h1>
          <p className="mt-1 text-[#92735C]">
            Already have an account?{" "}
            <Link href="/auth" className="font-semibold hover:underline" style={{ color: ACCENT }}>
              Login
            </Link>
          </p>

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
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#697254]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
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
              {password && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#92735C]">
                    <span>Password strength</span>
                    <span
                      className={
                        passwordStrength <= 2
                          ? "text-red-500"
                          : passwordStrength <= 3
                            ? "text-amber-500"
                            : "text-green-600"
                      }
                    >
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-[#B69C85]/30 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#697254]">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  className="h-12 rounded-xl border-[#B69C85]/30 bg-white/60 focus:border-[#697254] focus:ring-[#697254]/20 pr-10"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#92735C] hover:text-[#697254]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={agreedToTerms}
                onCheckedChange={(v) => setAgreedToTerms(!!v)}
                className="mt-0.5 border-[#B69C85]/50 data-[state=checked]:bg-[#697254] data-[state=checked]:border-[#697254]"
              />
              <span className="text-sm text-[#92735C]">
                I agree to the{" "}
                <Link href="#" className="font-medium hover:underline" style={{ color: ACCENT }}>
                  Terms and Conditions
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl text-[#EFE5D8] hover:opacity-95 transition-opacity"
              style={{ backgroundColor: ACCENT }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-[#EFE5D8] border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Sign Up
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
