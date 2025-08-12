"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Scale, CheckCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingWeightPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [weight, setWeight] = useState<number | undefined>(user?.profile.weight)

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
      await updateUser({ profile: { weight } })
      router.push("/onboarding/complete")
    } catch (error) {
      // Error toast is already handled in the updateUser function
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-pickly-teal to-pickly-green rounded-full mx-auto flex items-center justify-center mb-4">
          <Scale className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-pickly-teal via-pickly-green to-pickly-pink bg-clip-text text-transparent">
          What is your weight?
        </h1>
        <p className="text-gray-600 font-medium">Final step - enter your weight in kilograms</p>
      </div>

      {/* Form Card */}
      <div>
        <Card className="backdrop-blur-lg bg-white/80 border-0 shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="weight" className="text-lg font-semibold text-gray-700">
                  Weight (kg)
                </Label>
                <div>
                  <Input
                    id="weight"
                    type="number"
                    min={20}
                    max={300}
                    value={weight || ""}
                    onChange={(e) => setWeight(e.target.valueAsNumber)}
                    placeholder="Enter your weight in kg"
                    className="text-center text-2xl font-bold h-16 border-2 border-gray-200 focus:border-pickly-teal rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pickly-teal via-pickly-green to-pickly-pink hover:from-pickly-green hover:via-pickly-pink hover:to-pickly-purple rounded-xl group"
                  disabled={!weight}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5" />
                    Complete Setup
                    <div className="h-5 w-5" />
                  </div>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
