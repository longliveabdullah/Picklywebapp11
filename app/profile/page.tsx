"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "@/types"

const skinTypes = [
  { value: "normal", label: "Normal" },
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
]

const scalpTypes = [
  { value: "normal", label: "Normal" },
  { value: "dry", label: "Dry" },
  { value: "oily", label: "Oily" },
  { value: "sensitive", label: "Sensitive" },
]

const formSchema = z.object({
  age: z.number().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  height: z.number().min(50).max(250).optional(),
  weight: z.number().min(20).max(300).optional(),
  hasDiabetes: z.boolean().optional(),
  allergies: z.string().optional(),
  skinType: z.enum(["normal", "oily", "dry", "combination", "sensitive"]).optional(),
  scalpType: z.enum(["normal", "dry", "oily", "sensitive"]).optional(),
})

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: user?.profile.age,
      gender: user?.profile.gender,
      height: user?.profile.height,
      weight: user?.profile.weight,
      hasDiabetes: user?.profile.hasDiabetes || false,
      allergies: user?.profile.allergies?.join(", ") || "",
      skinType: user?.profile.skinType,
      scalpType: user?.profile.scalpType,
    },
  })

  const hasDiabetes = watch("hasDiabetes")

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)

      const updatedProfile: UserProfile = {
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        hasDiabetes: data.hasDiabetes,
        allergies: data.allergies ? data.allergies.split(",").map((a) => a.trim()) : [],
        skinType: data.skinType,
        scalpType: data.scalpType,
      }

      await updateUser({
        profile: updatedProfile,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      router.push("/home")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-4 pb-24">
          <div className="mx-auto max-w-md space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold">Your Profile</h1>
              <p className="mt-2 text-muted-foreground">Update your information to get more accurate product ratings</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Basic Information</h2>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={13}
                    max={120}
                    {...register("age", { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.age && <p className="text-sm text-red-500">{errors.age.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    onValueChange={(value) => setValue("gender", value as UserProfile["gender"])}
                    defaultValue={user?.profile.gender}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={50}
                    max={250}
                    {...register("height", { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.height && <p className="text-sm text-red-500">{errors.height.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min={20}
                    max={300}
                    {...register("weight", { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.weight && <p className="text-sm text-red-500">{errors.weight.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Health Information</h2>

                <div className="flex items-center justify-between">
                  <Label htmlFor="hasDiabetes">Do you have diabetes?</Label>
                  <Switch
                    id="hasDiabetes"
                    checked={hasDiabetes}
                    onCheckedChange={(checked) => setValue("hasDiabetes", checked)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies (comma separated)</Label>
                  <Input
                    id="allergies"
                    placeholder="e.g. nuts, dairy, gluten"
                    {...register("allergies")}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Skin & Hair</h2>

                <div className="space-y-2">
                  <Label htmlFor="skinType">Skin Type</Label>
                  <Select
                    onValueChange={(value) => setValue("skinType", value as UserProfile["skinType"])}
                    defaultValue={user?.profile.skinType}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skin type" />
                    </SelectTrigger>
                    <SelectContent>
                      {skinTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scalpType">Scalp Type</Label>
                  <Select
                    onValueChange={(value) => setValue("scalpType", value as UserProfile["scalpType"])}
                    defaultValue={user?.profile.scalpType}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scalp type" />
                    </SelectTrigger>
                    <SelectContent>
                      {scalpTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
