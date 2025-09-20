"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Heart, Edit2 } from "lucide-react"
import type { UserProfile } from "@/types"

const skinTypes = [
  { value: "normal", label: "Normal" },
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
]

const skinTones = [
  { value: "fair", label: "Fair" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "tan", label: "Tan" },
  { value: "dark", label: "Dark" },
  { value: "deep", label: "Deep" },
]

const skinConcerns = [
  {
    value: "acne",
    label: "Acne",
    description: "breakouts and blemishes",
  },
  {
    value: "aging",
    label: "Aging",
    description: "fine lines and wrinkles",
  },
  {
    value: "dark_spots",
    label: "Dark Spots",
    description: "hyperpigmentation and discoloration",
  },
  {
    value: "dryness",
    label: "Dryness",
    description: "tight, flaky, or rough skin",
  },
]

const scalpTypes = [
  { value: "normal", label: "Normal" },
  { value: "dry", label: "Dry" },
  { value: "oily", label: "Oily" },
  { value: "sensitive", label: "Sensitive" },
]

const hairConditions = [
  {
    value: "hair_loss",
    label: "Hair Loss",
    description: "from stress, hormones, genetics",
  },
  {
    value: "dandruff",
    label: "Dandruff",
    description: "white flakes fall from the hair",
  },
  {
    value: "curly",
    label: "Curly",
    description: "dry, brittle, porous",
  },
  {
    value: "dry",
    label: "Dry",
    description: "brittle, frizzy, tangles when wet",
  },
  {
    value: "oily",
    label: "Oily",
    description: "has a greasy shine, clumps together",
  },
  {
    value: "dyed",
    label: "Dyed",
    description: "prone to dryness, brittle",
  },
]

const formSchema = z.object({
  age: z.number().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  height: z.number().min(50).max(250).optional(),
  weight: z.number().min(20).max(300).optional(),
  hasDiabetes: z.boolean().optional(),
  allergies: z.string().optional(),
  skinType: z.enum(["normal", "oily", "dry", "combination", "sensitive"]).optional(),
  skinTone: z.enum(["fair", "light", "medium", "tan", "dark", "deep"]).optional(),
  skinConcerns: z.array(z.string()).optional(),
  scalpType: z.enum(["normal", "dry", "oily", "sensitive"]).optional(),
  hairConditions: z.array(z.string()).optional(),
})

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSkinConcerns, setSelectedSkinConcerns] = useState<string[]>(user?.profile.skinConcerns || [])
  const [selectedHairConditions, setSelectedHairConditions] = useState<string[]>(user?.profile.hairConditions || [])

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
      skinTone: user?.profile.skinTone,
      skinConcerns: user?.profile.skinConcerns || [],
      scalpType: user?.profile.scalpType,
      hairConditions: user?.profile.hairConditions || [],
    },
  })

  const toggleSkinConcern = (concern: string) => {
    const updated = selectedSkinConcerns.includes(concern)
      ? selectedSkinConcerns.filter((c) => c !== concern)
      : [...selectedSkinConcerns, concern]
    setSelectedSkinConcerns(updated)
    setValue("skinConcerns", updated)
  }

  const toggleHairCondition = (condition: string) => {
    const updated = selectedHairConditions.includes(condition)
      ? selectedHairConditions.filter((c) => c !== condition)
      : [...selectedHairConditions, condition]
    setSelectedHairConditions(updated)
    setValue("hairConditions", updated)
  }

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
        skinTone: data.skinTone,
        skinConcerns: selectedSkinConcerns,
        scalpType: data.scalpType,
        hairConditions: selectedHairConditions,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700">
        <Header />
        <main className="container py-4 pb-24">
          <div className="mx-auto max-w-md space-y-6">
            <div className="text-center text-white space-y-4">
              <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center">
                <div className="w-16 h-16 bg-white/30 rounded-full"></div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-semibold">{user?.email?.split("@")[0] || "User"}</h1>
                <Edit2 className="w-4 h-4" />
              </div>

              <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white border-0 rounded-full py-3">
                <Heart className="w-4 h-4 mr-2" />
                My Personal Shelf
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-white rounded-3xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-purple-600 font-medium">Age</Label>
                    <div className="text-2xl font-bold text-gray-900">{user?.profile.age || 15}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-600 font-medium">Height (cm)</Label>
                    <div className="text-2xl font-bold text-gray-900">{user?.profile.height || 269}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-cyan-600 font-medium">Weight (kg)</Label>
                    <div className="text-2xl font-bold text-gray-900">{user?.profile.weight || 30}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-600 font-medium">Diabetes</Label>
                    <Select
                      onValueChange={(value) => setValue("hasDiabetes", value === "yes")}
                      defaultValue={user?.profile.hasDiabetes ? "yes" : "no"}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="border-0 bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-600 font-medium">Allergies & Sensitivities</Label>
                  <textarea
                    className="w-full p-3 border-0 bg-gray-50 rounded-lg resize-none"
                    rows={3}
                    placeholder="List any allergies, sensitivities, or ingredients to avoid..."
                    {...register("allergies")}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                  <h2 className="text-lg font-semibold text-gray-900">Skin Profile</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Skin Type</Label>
                    <Select
                      onValueChange={(value) => setValue("skinType", value as UserProfile["skinType"])}
                      defaultValue={user?.profile.skinType}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="border-0 bg-white">
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
                    <Label className="text-gray-700 font-medium">Skin Tone</Label>
                    <Select
                      onValueChange={(value) => setValue("skinTone", value as UserProfile["skinTone"])}
                      defaultValue={user?.profile.skinTone}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="border-0 bg-white">
                        <SelectValue placeholder="Select skin tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {skinTones.map((tone) => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">Skin Concerns</Label>
                    <div className="space-y-2">
                      {skinConcerns.map((concern) => (
                        <div
                          key={concern.value}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedSkinConcerns.includes(concern.value)
                              ? "border-cyan-500 bg-cyan-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          onClick={() => toggleSkinConcern(concern.value)}
                        >
                          <div className="font-medium text-gray-900">{concern.label}</div>
                          <div className="text-sm text-gray-600">{concern.description}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">{selectedSkinConcerns.length} concerns selected</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                  <h2 className="text-lg font-semibold text-gray-900">Hair & Scalp Profile</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Scalp Type</Label>
                    <Select
                      onValueChange={(value) => setValue("scalpType", value as UserProfile["scalpType"])}
                      defaultValue={user?.profile.scalpType}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="border-0 bg-white">
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

                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">Hair Conditions</Label>
                    <div className="space-y-2">
                      {hairConditions.map((condition) => (
                        <div
                          key={condition.value}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedHairConditions.includes(condition.value)
                              ? "border-cyan-500 bg-cyan-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          onClick={() => toggleHairCondition(condition.value)}
                        >
                          <div className="font-medium text-gray-900">{condition.label}</div>
                          <div className="text-sm text-gray-600">{condition.description}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">{selectedHairConditions.length} conditions selected</div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white border-0 rounded-full py-4 text-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
