"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ProfileShareCard } from "@/components/profile-share-card"
import {
  categoryMeta,
  featuredShelfIds,
  fragranceMomentMeta,
  formatDate,
  routineTypeMeta,
  type FragranceMoment,
} from "@/lib/pickly-mock-data"
import { useSharedRoutine } from "@/hooks/use-shared-routine"
import { useSharedShelf } from "@/hooks/use-shared-shelf"
import type { UserProfile } from "@/types"

const ease = [0.22, 1, 0.36, 1] as const

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
  { value: "acne", label: "Acne" },
  { value: "aging", label: "Aging" },
  { value: "dark_spots", label: "Dark Spots" },
  { value: "dryness", label: "Dryness" },
]

const hairTypeOptions = [
  { value: "1a_straight", label: "1A Straight" },
  { value: "1b_straight", label: "1B Straight" },
  { value: "1c_straight", label: "1C Straight" },
  { value: "2a_wavy", label: "2A Wavy" },
  { value: "2b_wavy", label: "2B Wavy" },
  { value: "2c_wavy", label: "2C Wavy" },
  { value: "3a_curly", label: "3A Curly" },
  { value: "3b_curly", label: "3B Curly" },
  { value: "3c_curly", label: "3C Curly" },
  { value: "4a_coily", label: "4A Coily" },
  { value: "4b_coily", label: "4B Coily" },
  { value: "4c_coily", label: "4C Coily" },
]

const hairConcernOptions = [
  { value: "frizz", label: "Frizz" },
  { value: "dryness", label: "Dryness" },
  { value: "breakage", label: "Breakage" },
  { value: "hair_loss", label: "Hair Loss" },
  { value: "heat_damage", label: "Heat Damage" },
  { value: "split_ends", label: "Split Ends" },
  { value: "oily_scalp", label: "Oily Scalp" },
  { value: "dandruff", label: "Dandruff" },
  { value: "curl_definition", label: "Curl Definition" },
  { value: "volume", label: "Volume" },
  { value: "shrinkage", label: "Shrinkage" },
  { value: "scalp_sensitivity", label: "Scalp Sensitivity" },
]

const hairGoalOptions = [
  { value: "hair_growth", label: "Hair Growth" },
  { value: "stronger_hair", label: "Stronger Hair" },
  { value: "curl_definition", label: "Curl Definition" },
  { value: "shinier_hair", label: "Shinier Hair" },
  { value: "volume", label: "Volume" },
  { value: "less_frizz", label: "Less Frizz" },
  { value: "hydration", label: "Hydration" },
  { value: "repair_damage", label: "Repair Damage" },
  { value: "healthy_scalp", label: "Healthy Scalp" },
]

const formSchema = z.object({
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  vegan: z.boolean().optional(),
  allergies: z.string().optional(),
  skinType: z.enum(["normal", "oily", "dry", "combination", "sensitive"]).optional(),
  skinTone: z.enum(["fair", "light", "medium", "tan", "dark", "deep"]).optional(),
  skinConcerns: z.array(z.string()).optional(),
  hairType: z.string().optional(),
  hairConditions: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
})

const feedPosts = [
  {
    id: "1",
    timeAgo: "2 hours ago",
    text: "My barrier-first morning routine has been so good lately. Vitamin C, ceramides, SPF, and absolutely no irritation ✨",
    image: "/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png",
    likes: 48,
    comments: 12,
  },
  {
    id: "2",
    timeAgo: "Yesterday",
    text: "Shelf check: I finally narrowed my routine down to products I actually repurchase. Quality over clutter from now on.",
    image: "/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png",
    likes: 124,
    comments: 31,
  },
  {
    id: "3",
    timeAgo: "3 days ago",
    text: "Current PM lineup for smooth texture and a healthy glow. Pickly made it so much easier to curate this shelf 🌿",
    image: "/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png",
    likes: 312,
    comments: 67,
  },
]

const badges = [
  { id: "1", icon: "🧴", name: "Shelf Master", desc: "Added 10 products to shelf", earned: true },
  { id: "2", icon: "🌿", name: "Clean Streak", desc: "5 clean products in a row", earned: true },
  { id: "3", icon: "✨", name: "Routine Curator", desc: "Built both AM and PM routines", earned: true },
  { id: "4", icon: "🔬", name: "Ingredient Pro", desc: "Scanned 50 products", earned: false },
  { id: "5", icon: "💚", name: "Community Star", desc: "Reached 100 followers", earned: true },
  { id: "6", icon: "🏆", name: "Top Reviewer", desc: "Posted 25 reviews", earned: false },
]

export default function ProfilePage() {
  const { user, updateUser, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"feed" | "routine" | "badges">("feed")
  const [isLoading, setIsLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedSkinConcerns, setSelectedSkinConcerns] = useState<string[]>(user?.profile.skinConcerns || [])
  const [selectedHairConcerns, setSelectedHairConcerns] = useState<string[]>(user?.profile.hairConditions || [])
  const [selectedHairGoals, setSelectedHairGoals] = useState<string[]>(user?.profile.goals || [])
  const { routine } = useSharedRoutine()
  const { products: shelfProducts } = useSharedShelf()

  const displayName = user?.email?.split("@")[0] || "User"
  const stats = [
    { value: "128", label: "POSTS" },
    { value: "2.5k", label: "FOLLOWERS" },
    { value: `${shelfProducts.length}`, label: "PRODUCTS" },
  ]

  const { handleSubmit, setValue, watch } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: user?.profile.gender,
      vegan: user?.profile.vegan || false,
      allergies: user?.profile.allergies?.join(", ") || "",
      skinType: user?.profile.skinType,
      skinTone: user?.profile.skinTone,
      skinConcerns: user?.profile.skinConcerns || [],
      hairType: user?.profile.hairType,
      hairConditions: user?.profile.hairConditions || [],
      goals: user?.profile.goals || [],
    },
  })

  const featuredProducts = useMemo(
    () => ({
      favorites: shelfProducts.filter((product) => product.is_favorite).slice(0, 4),
      fragranceMoments: (["morning", "night", "winter", "summer"] as FragranceMoment[]).map((moment) => ({
        moment,
        products: shelfProducts.filter(
          (product) => product.category === "fragrance" && product.fragrance_moment === moment,
        ),
      })),
      repurchased: shelfProducts.filter((product) => featuredShelfIds.repurchased.includes(product.id)),
    }),
    [shelfProducts],
  )

  const skinSummary = useMemo(() => {
    const tone = user?.profile.skinTone ? `${user.profile.skinTone} tone` : "glow-focused"
    const type = user?.profile.skinType ? `${user.profile.skinType} skin` : "barrier-first"
    const topConcern = selectedSkinConcerns[0]?.replace("_", " ") || "clean beauty"
    return `${type}, ${tone}, focused on ${topConcern}`
  }, [selectedSkinConcerns, user?.profile.skinTone, user?.profile.skinType])

  const profileTags = useMemo(() => {
    const tags: { label: string; value: string; tone: "sage" | "sand" }[] = []

    if (user?.profile.skinType) {
      tags.push({
        label: "Skin Type",
        value: user.profile.skinType.charAt(0).toUpperCase() + user.profile.skinType.slice(1),
        tone: "sage",
      })
    }

    if (user?.profile.hairType) {
      const hairTypeLabel =
        hairTypeOptions.find((option) => option.value === user.profile.hairType)?.label ??
        user.profile.hairType
      tags.push({
        label: "Hair Type",
        value: hairTypeLabel,
        tone: "sand",
      })
    }

    return tags
  }, [user?.profile.hairType, user?.profile.skinType])

  const resolveProduct = (productId: string) => shelfProducts.find((product) => product.id === productId)

  const toggleSkinConcern = (concern: string) => {
    const updated = selectedSkinConcerns.includes(concern)
      ? selectedSkinConcerns.filter((c) => c !== concern)
      : [...selectedSkinConcerns, concern]
    setSelectedSkinConcerns(updated)
    setValue("skinConcerns", updated)
  }

  const toggleHairConcern = (condition: string) => {
    if (!selectedHairConcerns.includes(condition) && selectedHairConcerns.length >= 3) {
      toast({
        title: "Up to 3 concerns",
        description: "Choose the top 3 hair concerns that matter most right now.",
      })
      return
    }

    const updated = selectedHairConcerns.includes(condition)
      ? selectedHairConcerns.filter((c) => c !== condition)
      : [...selectedHairConcerns, condition]
    setSelectedHairConcerns(updated)
    setValue("hairConditions", updated)
  }

  const toggleHairGoal = (goal: string) => {
    const updated = selectedHairGoals.includes(goal)
      ? selectedHairGoals.filter((g) => g !== goal)
      : [...selectedHairGoals, goal]
    setSelectedHairGoals(updated)
    setValue("goals", updated)
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/profile`
    await navigator.clipboard.writeText(url)
    toast({ title: "Link copied", description: "Your Pickly profile link is ready to share." })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/profile`
    const text = `${displayName}'s Pickly routine: clean beauty, curated shelf, signature glow. Discover it on Pickly. ${url}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Pickly Routine`,
          text,
          url,
        })
        return
      } catch {
        // Fall back to copy if native share is cancelled or unavailable.
      }
    }

    await navigator.clipboard.writeText(text)
    toast({ title: "Share text copied", description: "You can now paste it into any app." })
  }

  const handleWhatsAppShare = () => {
    const url = `${window.location.origin}/profile`
    const text = `${displayName}'s Pickly routine: clean beauty, curated shelf, signature glow. ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      const updatedProfile: UserProfile = {
        age: user?.profile.age,
        gender: data.gender,
        height: user?.profile.height,
        weight: user?.profile.weight,
        hasDiabetes: user?.profile.hasDiabetes,
        vegan: data.vegan,
        allergies: data.allergies ? data.allergies.split(",").map((a) => a.trim()) : user?.profile.allergies || [],
        skinType: data.skinType,
        skinTone: data.skinTone,
        skinConcerns: selectedSkinConcerns,
        hairType: data.hairType,
        scalpType: user?.profile.scalpType,
        hairConditions: selectedHairConcerns,
        goals: selectedHairGoals,
      }
      await updateUser({ profile: updatedProfile })
      toast({ title: "Profile updated", description: "Your profile has been saved." })
      setSettingsOpen(false)
    } catch {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = ["feed", "routine", "badges"] as const

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F5EFE6] pb-24">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between px-5 pb-2 pt-5"
        >
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18" />
              <path d="M3 6h18" />
              <path d="M3 18h18" />
            </svg>
          </button>

          <h1 className="text-lg font-bold text-[#2D2D2D]">Pickly</h1>

          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#F5EFE6] pb-10">
              <SheetHeader className="mb-5">
                <SheetTitle className="text-lg font-bold text-[#2D2D2D]">Edit Profile</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-1">
                <div className="rounded-2xl bg-white p-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#92735C]/50">Lifestyle Preference</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#92735C]/65">
                      Help Pickly tailor recommendations to products that match your values.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F5EFE6] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#2D2D2D]">Vegan Preference</p>
                        <p className="mt-0.5 text-[11px] text-[#92735C]/65">
                          Prioritize vegan-friendly product recommendations.
                        </p>
                      </div>

                      <div className="flex rounded-full bg-white p-1">
                        {[
                          { label: "Off", value: false },
                          { label: "On", value: true },
                        ].map((option) => {
                          const isActive = (watch("vegan") ?? false) === option.value
                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => setValue("vegan", option.value)}
                              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                                isActive ? "bg-[#697254] text-[#EFE5D8]" : "text-[#92735C]/60"
                              }`}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#92735C]/50">Skin Profile</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-[#697254]">Skin Type</Label>
                      <Select
                        onValueChange={(v) => setValue("skinType", v as UserProfile["skinType"])}
                        defaultValue={user?.profile.skinType}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="mt-1 border-0 bg-[#F5EFE6]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {skinTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#697254]">Skin Tone</Label>
                      <Select
                        onValueChange={(v) => setValue("skinTone", v as UserProfile["skinTone"])}
                        defaultValue={user?.profile.skinTone}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="mt-1 border-0 bg-[#F5EFE6]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {skinTones.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#697254]">Concerns</Label>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {skinConcerns.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => toggleSkinConcern(c.value)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                              selectedSkinConcerns.includes(c.value)
                                ? "bg-[#697254] text-[#EFE5D8]"
                                : "bg-[#F5EFE6] text-[#92735C]"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#92735C]/50">Hair Profile</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#92735C]/65">
                      Shape recommendations around your curl pattern, top concerns, and hair goals.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-[#697254]">Curl Pattern / Hair Type</Label>
                      <Select
                        onValueChange={(v) => setValue("hairType", v)}
                        defaultValue={user?.profile.hairType}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="mt-1 border-0 bg-[#F5EFE6]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {hairTypeOptions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="mt-1.5 text-[10px] text-[#92735C]/55">
                        Type 1 = Straight, Type 2 = Wavy, Type 3 = Curly, Type 4 = Coily
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-semibold text-[#697254]">Main Hair Concerns</Label>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#92735C]/50">
                          {selectedHairConcerns.length}/3
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {hairConcernOptions.map((c) => {
                          const selected = selectedHairConcerns.includes(c.value)
                          const limitReached = !selected && selectedHairConcerns.length >= 3
                          return (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => toggleHairConcern(c.value)}
                            disabled={limitReached}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                              selected
                                ? "bg-[#697254] text-[#EFE5D8]"
                                : "bg-[#F5EFE6] text-[#92735C]"
                            } ${limitReached ? "opacity-45" : ""}`}
                          >
                            {c.label}
                          </button>
                        )})}
                      </div>
                      <p className="text-[10px] text-[#92735C]/55">
                        Pick the top concerns you want Pickly to prioritize most.
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#697254]">Hair Goals</Label>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {hairGoalOptions.map((goal) => (
                          <button
                            key={goal.value}
                            type="button"
                            onClick={() => toggleHairGoal(goal.value)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                              selectedHairGoals.includes(goal.value)
                                ? "bg-[#92735C] text-[#EFE5D8]"
                                : "bg-[#F5EFE6] text-[#92735C]"
                            }`}
                          >
                            {goal.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#92735C]/55">
                        These goals help Pickly recommend the right routine direction.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-[#697254] py-3.5 text-sm font-semibold text-[#EFE5D8] shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={async () => { await signOut(); router.push("/") }}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold text-red-500 ring-1 ring-red-200 transition-all hover:bg-red-50"
                >
                  Sign Out
                </button>
              </form>
            </SheetContent>
          </Sheet>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="mx-5 mt-2 rounded-3xl bg-white pb-6 pt-8"
        >
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#E8E2D8] ring-4 ring-[#A7AD89]/30">
                <span className="text-3xl font-bold text-[#697254]">
                  {displayName[0]?.toUpperCase()}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#697254]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>

            <h2 className="text-lg font-bold text-[#2D2D2D]">{displayName}</h2>

            {profileTags.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {profileTags.map((tag) => (
                  <div
                    key={tag.label}
                    className={`rounded-full border px-3.5 py-2 text-center shadow-[0_2px_8px_rgba(146,115,92,0.06)] ${
                      tag.tone === "sage"
                        ? "border-[#E7E5DA] bg-[#FAFBF6]"
                        : "border-[#B69C85]/25 bg-[#FBF7F2]"
                    }`}
                  >
                    <p
                      className={`text-[8px] font-bold uppercase tracking-[0.18em] ${
                        tag.tone === "sage" ? "text-[#697254]/55" : "text-[#92735C]/55"
                      }`}
                    >
                      {tag.label}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-[#2D2D2D]">
                      {tag.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 max-w-[260px] text-center text-[13px] leading-relaxed text-[#92735C]/80">
              Clean beauty collector. Building a shelf worth sharing and a routine that actually works. 🌿
            </p>
          </div>

          <div className="mt-6 flex items-center justify-around border-t border-[#E8E2D8] px-6 pt-5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-lg font-bold text-[#2D2D2D]">{stat.value}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#92735C]/50">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease }}
          className="mt-5 flex items-center justify-around border-b border-[#E8E2D8] px-5"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab ? "text-[#697254]" : "text-[#92735C]/45"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#697254]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="space-y-4 px-5 pt-5"
            >
              {feedPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease }}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3 p-4 pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#697254]">
                      <span className="text-sm font-bold text-[#EFE5D8]">
                        {displayName[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#2D2D2D]">{displayName}</p>
                      <p className="text-[11px] text-[#92735C]/50">{post.timeAgo}</p>
                    </div>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#92735C]/10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#92735C">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                  </div>

                  <p className="px-4 pb-3 text-[13px] leading-relaxed text-[#2D2D2D]/85">
                    {post.text}
                  </p>

                  <div className="relative h-48 w-full bg-[#E8E2D8]">
                    <Image src={post.image} alt="Post" fill className="object-cover" />
                  </div>

                  <div className="flex items-center gap-6 px-4 py-3">
                    <button className="flex items-center gap-1.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      <span className="text-xs font-semibold text-[#697254]">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-[#92735C]">{post.comments}</span>
                    </button>
                    <div className="flex-1" />
                    <button onClick={handleShare}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "routine" && (
            <motion.div
              key="routine"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="space-y-4 px-5 pt-5"
            >
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-[#2D2D2D]">Routine Showcase</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#92735C]/70">
                      This is your beauty identity card: routines, hero products, and shelf taste.
                    </p>
                  </div>
                  <div className="rounded-full bg-[#A7AD89]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#697254]">
                    Share-ready
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#697254]/10 px-3 py-1.5 text-[11px] font-semibold text-[#697254]">
                    AM {routine.am.length} steps
                  </span>
                  <span className="rounded-full bg-[#92735C]/10 px-3 py-1.5 text-[11px] font-semibold text-[#92735C]">
                    PM {routine.pm.length} steps
                  </span>
                  <span className="rounded-full bg-[#DBD0C4]/50 px-3 py-1.5 text-[11px] font-semibold text-[#92735C]">
                    {shelfProducts.length} products in shelf
                  </span>
                </div>
                <div className="mt-4 rounded-2xl bg-[#F5EFE6] p-3.5">
                  <p className="text-[11px] font-semibold leading-relaxed text-[#92735C]/70">
                    Routine editing now lives on your `home` page in the dedicated `Build My Routine` card, while this page stays focused on preview and sharing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(["am", "pm"] as const).map((period) => (
                  <div key={period} className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-base font-bold text-[#2D2D2D]">{period.toUpperCase()} Routine</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#92735C]/50">
                        {routine[period].length} steps
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {routine[period].map((step, index) => {
                        const product = resolveProduct(step.productId)
                        return (
                          <div key={step.id} className="flex items-start gap-3 rounded-2xl bg-[#F5EFE6] p-3.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#697254]">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-[12px] font-bold text-[#2D2D2D]">
                                  {routineTypeMeta[step.type].label}
                                </p>
                                {product && (
                                  <span
                                    className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                                    style={{
                                      backgroundColor: `${categoryMeta[product.category].accent}18`,
                                      color: categoryMeta[product.category].accent,
                                    }}
                                  >
                                    {categoryMeta[product.category].label}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[13px] font-semibold text-[#697254]">
                                {product?.product_name ?? "Choose a product"}
                              </p>
                              {product && (
                                <p className="mt-0.5 text-[11px] text-[#92735C]/60">
                                  {product.brand} · Added {formatDate(product.created_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-[#2D2D2D]">Favs</p>
                  <button
                    onClick={() => router.push("/products")}
                    className="text-sm font-semibold text-[#697254]"
                  >
                    View Shelf
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {featuredProducts.favorites.map((product) => (
                    <div key={product.id} className="w-[170px] shrink-0 rounded-2xl bg-white p-4 shadow-sm">
                      <div
                        className="mb-3 flex h-16 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${categoryMeta[product.category].accent}18` }}
                      >
                        <span className="text-2xl">{product.icon}</span>
                      </div>
                      <p className="truncate text-[13px] font-bold text-[#2D2D2D]">{product.product_name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#92735C]/55">{product.brand}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {product.is_repurchase && (
                          <span className="rounded-full bg-[#697254]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#697254]">
                            Repurchased
                          </span>
                        )}
                        {product.is_favorite && (
                          <span className="rounded-full bg-[#B69C85]/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#92735C]">
                            Holy Grail
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-[#2D2D2D]">Perfumes</p>
                  <button
                    onClick={() => router.push("/products")}
                    className="text-sm font-semibold text-[#92735C]"
                  >
                    Add Perfume
                  </button>
                </div>

                {featuredProducts.fragranceMoments.some((entry) => entry.products.length > 0) ? (
                  <div className="grid grid-cols-2 gap-3">
                    {featuredProducts.fragranceMoments.map(({ moment, products }) => (
                      <div key={moment} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#92735C]/10">
                            <span className="text-sm">
                              {moment === "morning" ? "☀️" : moment === "night" ? "🌙" : moment === "winter" ? "❄️" : "🌼"}
                            </span>
                          </div>
                          <p className="text-[12px] font-bold uppercase tracking-wide text-[#92735C]">
                            {fragranceMomentMeta[moment].label}
                          </p>
                        </div>

                        {products.length > 0 ? (
                          <div className="space-y-2">
                            {products.map((product) => (
                              <div key={product.id} className="rounded-xl bg-[#F8F3EE] p-3">
                                <p className="truncate text-[12px] font-bold text-[#2D2D2D]">{product.product_name}</p>
                                <p className="mt-0.5 truncate text-[10px] text-[#92735C]/60">{product.brand}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl bg-[#F8F3EE] p-3">
                            <p className="text-[11px] leading-relaxed text-[#92735C]/60">
                              No perfume added for {fragranceMomentMeta[moment].label.toLowerCase()} yet.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#92735C]/10">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="8" y="10" width="8" height="11" rx="2" />
                          <path d="M10 10V7h4v3" />
                          <path d="M12 7V4" />
                          <path d="M9 4h6" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-[#2D2D2D]">Fragrance Wardrobe</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-[#92735C]/70">
                          Add perfumes to your shelf and assign them to Morning, Night, Winter, or Summer.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-[#2D2D2D]">Share Your Pickly</p>
                  <span className="text-[11px] font-semibold text-[#92735C]/55">Link + aesthetic card</span>
                </div>

                <ProfileShareCard
                  displayName={displayName}
                  amSteps={routine.am}
                  pmSteps={routine.pm}
                  products={shelfProducts}
                />

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleShare}
                    className="rounded-2xl bg-[#697254] py-3 text-[12px] font-semibold text-[#EFE5D8] shadow-sm"
                  >
                    Share
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="rounded-2xl bg-white py-3 text-[12px] font-semibold text-[#2D2D2D] shadow-sm ring-1 ring-[#E8E2D8]"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="rounded-2xl bg-white py-3 text-[12px] font-semibold text-[#2D2D2D] shadow-sm ring-1 ring-[#E8E2D8]"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "badges" && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="px-5 pt-5"
            >
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: badge.earned ? 1 : 0.45, scale: 1 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease }}
                    className={`flex flex-col items-center rounded-2xl p-4 text-center ${
                      badge.earned ? "bg-white shadow-sm" : "bg-white/60"
                    }`}
                  >
                    <span className="mb-2 text-2xl">{badge.icon}</span>
                    <p className="text-[11px] font-bold leading-tight text-[#2D2D2D]">
                      {badge.name}
                    </p>
                    <p className="mt-0.5 text-[9px] leading-tight text-[#92735C]/60">
                      {badge.desc}
                    </p>
                    {badge.earned && (
                      <div className="mt-2 rounded-full bg-[#A7AD89]/20 px-2 py-0.5">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#697254]">
                          Earned
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  )
}
