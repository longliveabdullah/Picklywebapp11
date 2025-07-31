"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle } from "lucide-react"
import { AnimatedLogo } from "@/components/animated-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

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
  const [isVisible, setIsVisible] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
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
    setIsVisible(true)
  }, [])

  useEffect(() => {
    // Calculate password strength
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
    } catch (error: any) {
      console.error("Sign up error:", error)
      setError(error.message || "Failed to create account. Please try again.")
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pickly-pink/20 to-pickly-purple/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pickly-blue/20 to-pickly-teal/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pickly-purple/10 to-pickly-blue/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div
          className={`text-center mb-8 transition-all duration-700 ${isVisible ? "animate-fadeInDown opacity-100" : "opacity-0"}`}
        >
          <AnimatedLogo size="xl" />
          <h1 className="text-4xl font-bold mt-4 mb-2 bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue bg-clip-text text-transparent animate-gradientShift">
            Join Pickly
          </h1>
          <p className="text-gray-600 font-medium">Create your account and start making smarter choices</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Card */}
        <Card
          className={`backdrop-blur-lg bg-white/80 border-0 shadow-2xl transition-all duration-700 delay-200 ${isVisible ? "animate-scaleIn opacity-100" : "opacity-0"}`}
        >
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div
                className={`space-y-2 transition-all duration-500 delay-300 ${isVisible ? "animate-slideInLeft opacity-100" : "opacity-0"}`}
              >
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    className="input-focus-animation pl-4 pr-10 h-12 border-2 border-gray-200 focus:border-indigo-500 rounded-xl"
                    {...register("email")}
                  />
                  {errors.email ? (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  ) : (
                    watch("email") && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                    )
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1 animate-slideInLeft">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div
                className={`space-y-2 transition-all duration-500 delay-400 ${isVisible ? "animate-slideInRight opacity-100" : "opacity-0"}`}
              >
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                    className="input-focus-animation pl-4 pr-10 h-12 border-2 border-gray-200 focus:border-indigo-500 rounded-xl"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2 animate-fadeInUp">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span
                        className={`text-xs font-semibold ${passwordStrength <= 2 ? "text-red-500" : passwordStrength <= 3 ? "text-yellow-500" : "text-green-500"}`}
                      >
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1 animate-slideInRight">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div
                className={`space-y-2 transition-all duration-500 delay-500 ${isVisible ? "animate-slideInLeft opacity-100" : "opacity-0"}`}
              >
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="input-focus-animation pl-4 pr-10 h-12 border-2 border-gray-200 focus:border-indigo-500 rounded-xl"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1 animate-slideInLeft">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div
                className={`transition-all duration-500 delay-600 ${isVisible ? "animate-fadeInUp opacity-100" : "opacity-0"}`}
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue hover:from-pickly-purple hover:via-pickly-blue hover:to-pickly-teal button-hover-animation rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Create Account
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Sign In Link */}
            <div
              className={`text-center mt-6 transition-all duration-500 delay-700 ${isVisible ? "animate-fadeInUp opacity-100" : "opacity-0"}`}
            >
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div
          className={`mt-8 grid grid-cols-3 gap-4 transition-all duration-700 delay-800 ${isVisible ? "animate-fadeInUp opacity-100" : "opacity-0"}`}
        >
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-pickly-pink to-pickly-purple rounded-full mx-auto mb-2 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Personalized</p>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-pickly-purple to-pickly-blue rounded-full mx-auto mb-2 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-semibold text-gray-700">AI-Powered</p>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-pickly-blue to-pickly-teal rounded-full mx-auto mb-2 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Secure</p>
          </div>
        </div>
      </div>
    </div>
  )
}
