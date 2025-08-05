"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "@/types"

const genderOptions: { value: UserProfile["gender"]; label: string; icon: string }[] = [
  { value: "male", label: "Male", icon: "♂" },
  { value: "female", label: "Female", icon: "♀" },
  { value: "other", label: "Other", icon: "⚧" },
  { value: "prefer-not-to-say", label: "Prefer not to say", icon: "◯" },
]

export default function OnboardingGenderPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [gender, setGender] = useState<UserProfile["gender"]>(user?.profile.gender)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!gender) {
      toast({
        title: "Selection required",
        description: "Please select an option to continue",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await updateUser({
        profile: {
          ...user?.profile,
          gender,
        },
      })

      setTimeout(() => {
        router.push("/onboarding/height")
      }, 300)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your selection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-pickly-purple to-pickly-blue rounded-full mx-auto flex items-center justify-center mb-4"
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
            <Users className="h-8 w-8 text-white" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pickly-purple via-pickly-blue to-pickly-teal bg-clip-text text-transparent">
            What is your gender?
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            This helps us provide more relevant product recommendations
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="backdrop-blur-lg bg-white/80 border-0 shadow-xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-3">
                  {genderOptions.map((option, index) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      <Button
                        type="button"
                        variant={gender === option.value ? "default" : "outline"}
                        className={`w-full h-16 text-left justify-start text-lg font-semibold transition-all duration-300 rounded-xl ${
                          gender === option.value
                            ? "bg-gradient-to-r from-pickly-purple to-pickly-blue text-white shadow-lg scale-105"
                            : "bg-white/60 hover:bg-white/80 border-2 border-gray-200 hover:border-pickly-purple"
                        }`}
                        onClick={() => setGender(option.value)}
                        disabled={isLoading}
                        whileHover={{ scale: gender === option.value ? 1.05 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-2xl mr-4">{option.icon}</span>
                        {option.label}
                        {gender === option.value && (
                          <motion.div
                            className="ml-auto"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                          </motion.div>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Button
                    type="submit"
                    className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-pickly-purple via-pickly-blue to-pickly-teal hover:from-pickly-blue hover:via-pickly-teal hover:to-pickly-green transition-all duration-300 rounded-xl"
                    disabled={isLoading || !gender}
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
                        Saving...
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-3">
                        Continue
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.div>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
