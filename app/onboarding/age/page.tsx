"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingAgePage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [age, setAge] = useState<number | undefined>(user?.profile.age)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!age || age < 13 || age > 120) {
      toast({
        title: "Invalid age",
        description: "Please enter a valid age between 13 and 120",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await updateUser({
        profile: {
          ...user?.profile,
          age,
        },
      })

      // Add a small delay for smooth transition
      setTimeout(() => {
        router.push("/onboarding/gender")
      }, 300)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your age. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="w-16 h-16 bg-gradient-to-r from-pickly-pink to-pickly-purple rounded-full mx-auto flex items-center justify-center mb-4"
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
          <Calendar className="h-8 w-8 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue bg-clip-text text-transparent">
          How old are you?
        </h1>
        <p className="text-gray-600 font-medium">We use this to provide more personalized product recommendations</p>
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
                <Label htmlFor="age" className="text-lg font-semibold text-gray-700">
                  Your Age
                </Label>
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Input
                    id="age"
                    type="number"
                    min={13}
                    max={120}
                    value={age || ""}
                    onChange={(e) => setAge(e.target.valueAsNumber)}
                    placeholder="Enter your age"
                    className="text-center text-2xl font-bold h-16 border-2 border-gray-200 focus:border-pickly-purple rounded-xl transition-all duration-300"
                    disabled={isLoading}
                  />
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue hover:from-pickly-purple hover:via-pickly-blue hover:to-pickly-teal transition-all duration-300 rounded-xl group"
                  disabled={isLoading || !age}
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

      {/* Age Range Hints */}
      <motion.div
        className="grid grid-cols-3 gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {[
          { range: "13-17", label: "Teen", color: "from-pink-400 to-purple-400" },
          { range: "18-64", label: "Adult", color: "from-purple-400 to-blue-400" },
          { range: "65+", label: "Senior", color: "from-blue-400 to-teal-400" },
        ].map((item, index) => (
          <motion.div
            key={item.range}
            className="p-4 bg-white/60 backdrop-blur-sm rounded-xl"
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ animationDelay: `${0.9 + index * 0.1}s` }}
          >
            <div className={`w-8 h-8 bg-gradient-to-r ${item.color} rounded-full mx-auto mb-2`} />
            <p className="text-sm font-semibold text-gray-700">{item.range}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
