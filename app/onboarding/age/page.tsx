"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingAgePage() {
  const { user, updateUser, setLocalUserProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [age, setAge] = useState<number | undefined>(user?.profile.age)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // --- 1. Client-side validation ---
    // This remains the same. If validation fails, we show a toast and stop.
    if (!age || age < 13 || age > 120) {
      toast({
        title: "Invalid age",
        description: "Please enter a valid age between 13 and 120",
        variant: "destructive",
      })
      return
    }

    // --- 2. Optimistic UI Update ---
    // Update the local user state immediately. This is a synchronous, in-memory
    // update that ensures the next page shows the new value without flickering.
    setLocalUserProfile({ age })

    // --- 3. Immediate Navigation ---
    // Navigate to the next step without waiting for the backend save to complete.
    router.push("/onboarding/gender")

    // --- 4. Background Save & Instrumentation ---
    // This is the "fire-and-forget" part. We trigger the save operation but
    // do not `await` it. Error handling (showing toasts, adding to a retry
    // queue) is managed within the AuthContext.
    // We also add basic timing logs to measure the API call duration.
    const saveOperation = async () => {
      console.time("updateUser-age-save")
      try {
        await updateUser({
          profile: {
            age,
          },
        })
      } finally {
        console.timeEnd("updateUser-age-save")
      }
    }

    // Run the save operation in the background.
    void saveOperation()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-r from-pickly-pink to-pickly-purple rounded-full mx-auto flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue bg-clip-text text-transparent">
            How old are you?
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            We use this to provide more personalized product recommendations
          </p>
        </div>

        {/* Form Card */}
        <div>
          <Card className="backdrop-blur-lg bg-white/80 border-0 shadow-xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-lg font-semibold text-gray-700 sr-only">
                    Your Age
                  </Label>
                  <div>
                    <Input
                      id="age"
                      type="number"
                      min={13}
                      max={120}
                      value={age || ""}
                      onChange={(e) => setAge(e.target.valueAsNumber)}
                      placeholder="Enter your age"
                      className="text-center text-3xl font-bold h-20 border-2 border-gray-200 focus:border-pickly-purple rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue hover:from-pickly-purple hover:via-pickly-blue hover:to-pickly-teal rounded-xl group"
                    disabled={!age}
                  >
                    <div className="flex items-center gap-3">
                      Continue
                      <div className="h-5 w-5" />
                    </div>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Age Range Hints */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          {[
            { range: "13-17", label: "Teen", color: "from-pink-400 to-purple-400" },
            { range: "18-64", label: "Adult", color: "from-purple-400 to-blue-400" },
            { range: "65+", label: "Senior", color: "from-blue-400 to-teal-400" },
          ].map((item, index) => (
            <div
              key={item.range}
              className="p-3 bg-white/60 backdrop-blur-sm rounded-xl"
            >
              <div className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r ${item.color} rounded-full mx-auto mb-2`} />
              <p className="text-xs sm:text-sm font-semibold text-gray-700">{item.range}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
