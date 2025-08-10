"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ruler, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingHeightPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [height, setHeight] = useState<number | undefined>(user?.profile.height)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!height || height < 50 || height > 250) {
      toast({
        title: "Invalid height",
        description: "Please enter a valid height between 50 and 250 cm",
        variant: "destructive",
      })
      return
    }

    router.push("/onboarding/weight")

    void updateUser({
      profile: {
        height,
      },
    })
  }

  const getHeightCategory = (height: number) => {
    if (height < 160) return { label: "Petite", color: "from-pink-400 to-purple-400" }
    if (height < 180) return { label: "Average", color: "from-purple-400 to-blue-400" }
    return { label: "Tall", color: "from-blue-400 to-teal-400" }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-pickly-blue to-pickly-teal rounded-full mx-auto flex items-center justify-center mb-4">
          <Ruler className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-pickly-blue via-pickly-teal to-pickly-green bg-clip-text text-transparent">
          What is your height?
        </h1>
        <p className="text-gray-600 font-medium">Enter your height in centimeters</p>
      </div>

      {/* Form Card */}
      <div>
        <Card className="backdrop-blur-lg bg-white/80 border-0 shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="height" className="text-lg font-semibold text-gray-700">
                  Height (cm)
                </Label>
                <div>
                  <Input
                    id="height"
                    type="number"
                    min={50}
                    max={250}
                    value={height || ""}
                    onChange={(e) => setHeight(e.target.valueAsNumber)}
                    placeholder="Enter your height in cm"
                    className="text-center text-2xl font-bold h-16 border-2 border-gray-200 focus:border-pickly-blue rounded-xl"
                  />
                </div>

                {/* Height visualization */}
                {height && height >= 50 && height <= 250 && (
                  <div className="flex items-center justify-center mt-4">
                    <div className="flex items-end gap-2">
                      <div
                        className={`w-4 bg-gradient-to-t ${getHeightCategory(height).color} rounded-t-full`}
                        style={{ height: `${Math.max(20, (height / 250) * 80)}px` }}
                      />
                      <span className="text-sm font-medium text-gray-600 mb-1">
                        {getHeightCategory(height).label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pickly-blue via-pickly-teal to-pickly-green hover:from-pickly-teal hover:via-pickly-green hover:to-pickly-blue rounded-xl"
                  disabled={!height}
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

      {/* Height Range Hints */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { range: "< 160cm", label: "Petite", color: "from-pink-400 to-purple-400" },
          { range: "160-180cm", label: "Average", color: "from-purple-400 to-blue-400" },
          { range: "> 180cm", label: "Tall", color: "from-blue-400 to-teal-400" },
        ].map((item, index) => (
          <div
            key={item.range}
            className="p-4 bg-white/60 backdrop-blur-sm rounded-xl"
          >
            <div className={`w-8 h-8 bg-gradient-to-r ${item.color} rounded-full mx-auto mb-2`} />
            <p className="text-sm font-semibold text-gray-700">{item.range}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
