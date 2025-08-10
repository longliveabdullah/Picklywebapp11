"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!gender) {
      toast({
        title: "Selection required",
        description: "Please select an option to continue",
        variant: "destructive",
      })
      return
    }

    router.push("/onboarding/height")

    void updateUser({
      profile: {
        gender,
      },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-r from-pickly-purple to-pickly-blue rounded-full mx-auto flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pickly-purple via-pickly-blue to-pickly-teal bg-clip-text text-transparent">
            What is your gender?
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            This helps us provide more relevant product recommendations
          </p>
        </div>

        {/* Form Card */}
        <div>
          <Card className="backdrop-blur-lg bg-white/80 border-0 shadow-xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-3">
                  {genderOptions.map((option, index) => (
                    <div key={option.value}>
                      <Button
                        type="button"
                        variant={gender === option.value ? "default" : "outline"}
                        className={`w-full h-16 text-left justify-start text-lg font-semibold rounded-xl ${
                          gender === option.value
                            ? "bg-gradient-to-r from-pickly-purple to-pickly-blue text-white shadow-lg"
                            : "bg-white/60 hover:bg-white/80 border-2 border-gray-200 hover:border-pickly-purple"
                        }`}
                        onClick={() => setGender(option.value)}
                      >
                        <span className="text-2xl mr-4">{option.icon}</span>
                        {option.label}
                        {gender === option.value && (
                          <div className="ml-auto">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                          </div>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-pickly-purple via-pickly-blue to-pickly-teal hover:from-pickly-blue hover:via-pickly-teal hover:to-pickly-green rounded-xl"
                    disabled={!gender}
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
      </div>
    </div>
  )
}
