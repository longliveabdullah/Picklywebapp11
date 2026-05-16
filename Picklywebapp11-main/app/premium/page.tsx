"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { Check, Crown, Sparkles } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"

const plans = [
  {
    name: "Premium",
    price: "$9.99",
    period: "/month",
    description: "Unlock the full potential of Pickly",
    features: [
      "Unlimited product scans",
      "Advanced AI analysis",
      "Detailed ingredient breakdown",
      "Personalized recommendations",
      "Health impact insights",
      "Product comparison",
      "Priority support",
      "Export scan history",
    ],
    buttonText: "Upgrade Now",
    popular: true,
    disabled: false,
  },
]

export default function PremiumPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async (planName: string) => {
    setIsLoading(true)
    try {
      // In a real app, you would integrate with a payment processor like Stripe
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Upgrade Successful!",
        description: `Welcome to ${planName}! Your account has been upgraded.`,
      })
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "There was an error processing your upgrade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col pb-24 relative">
        {/* Blurred background content */}
        <div className="blur-sm">
          <Header />
          <main className="container flex-1 py-4">
            <div className="mx-auto max-w-4xl space-y-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  <h1 className="text-4xl font-bold pickly-gradient-text">Premium Plans</h1>
                </div>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Unlock advanced AI analysis and get the most personalized product recommendations
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-1 max-w-md mx-auto">
                {plans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={cn(
                      "relative transition-all duration-200 hover:shadow-lg",
                      plan.popular && "border-primary shadow-lg scale-105",
                    )}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pickly-pink to-pickly-purple">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    )}

                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-4">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={cn(
                          "w-full",
                          plan.popular && "bg-gradient-to-r from-pickly-pink to-pickly-purple hover:opacity-90",
                        )}
                        disabled={plan.disabled || isLoading}
                        onClick={() => handleUpgrade(plan.name)}
                      >
                        {isLoading ? "Processing..." : plan.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* Overlay message - always centered and visible */}
        <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
            <div className="space-y-4">
              <div className="text-4xl sm:text-5xl">👀</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pickly is free for now.</h2>
              <p className="text-lg sm:text-xl text-gray-700 font-medium">Enjoy it while it lasts</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
