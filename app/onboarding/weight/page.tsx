"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Scale, CheckCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { OnboardingLayout } from "@/components/onboarding-layout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingWeightPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [weight, setWeight] = useState<number | undefined>(user?.profile.weight)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!weight || weight < 20 || weight > 300) {
      toast({
        title: "Invalid weight",
        description: "Please enter a valid weight between 20 and 300 kg",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await updateUser({
        onboardingComplete: true,
        profile: {
          ...user?.profile,
          weight,
        },
      })

      setTimeout(() => {
        router.push("/home")
      }, 300)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your weight. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-pickly-teal to-pickly-green rounded-full mx-auto flex items-center justify-center mb-4"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Scale className="h-8 w-8 text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-pickly-teal via-pickly-green to-pickly-pink bg-clip-text text-transparent">
            What is your weight?
          </h1>
          <p className="text-gray-600 font-medium">Final step - enter your weight in kilograms</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="backdrop-blur-lg bg-white/80 border-0 shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="weight" className="text-lg font-semibold text-gray-700">
                    Weight (kg)
                  </Label>
                  <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Input
                      id="weight"
                      type="number"
                      min={20}
                      max={300}
                      value={weight || ""}
                      onChange={(e) => setWeight(e.target.valueAsNumber)}
                      placeholder="Enter your weight in kg"
                      className="text-center text-2xl font-bold h-16 border-2 border-gray-200 focus:border-pickly-teal rounded-xl transition-all duration-300"
                      disabled={isLoading}
                    />
                  </motion.div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pickly-teal via-pickly-green to-pickly-pink hover:from-pickly-green hover:via-pickly-pink hover:to-pickly-purple transition-all duration-300 rounded-xl group"
                    disabled={isLoading || !weight}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        />
                        Completing Setup...
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5" />
                        Complete Setup
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <Sparkles className="h-5 w-5" />
                        </motion.div>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Message */}
        <motion.div
          className="text-center p-6 bg-gradient-to-r from-pickly-teal/10 via-pickly-green/10 to-pickly-pink/10 backdrop-blur-sm rounded-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-8 w-8 text-pickly-teal mx-auto mb-3" />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Almost there!</h3>
          <p className="text-sm text-gray-600">Complete your profile to get personalized product recommendations</p>
        </motion.div>
      </div>
    </OnboardingLayout>
  )
}
