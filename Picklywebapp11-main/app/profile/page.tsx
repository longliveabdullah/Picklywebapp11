"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { ProfileAvatar } from "@/components/profile-avatar"
import {
  categoryMeta,
  fragranceMomentMeta,
  formatDate,
  routineTypeMeta,
  type FragranceMoment,
} from "@/lib/pickly-mock-data"
import { useProfileHeader } from "@/hooks/use-profile-header"
import { DEFAULT_BIO_PLACEHOLDER, MAX_BIO_LENGTH } from "@/lib/profile-bio"
import { useSharedRoutine } from "@/hooks/use-shared-routine"
import { useSharedShelf } from "@/hooks/use-shared-shelf"
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/display-name-storage"
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

type DbFeedPost = { id: string; body: string; image_path: string | null; created_at: string }
type DbBadge = { code: string; name: string; description: string; icon: string; earned: boolean; earned_at: string | null }
type FollowCounts = { followers: number; following: number }

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
  const { displayName, bio, avatarUrl, isUploadingAvatar, setDisplayName, setBio, uploadAvatar } =
    useProfileHeader(user?.id, user?.email)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [nameDraft, setNameDraft] = useState(displayName)
  const [bioDraft, setBioDraft] = useState(bio)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const bioInputRef = useRef<HTMLTextAreaElement>(null)

  const [feedPosts, setFeedPosts] = useState<DbFeedPost[]>([])
  const [badges, setBadges] = useState<DbBadge[]>([])
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 })

  useEffect(() => {
    if (!user?.id) return
    fetch("/api/social/feed?limit=10").then((r) => r.json()).then((d) => { if (d.posts) setFeedPosts(d.posts) }).catch(() => {})
    fetch("/api/badges").then((r) => r.json()).then((d) => { if (d.badges) setBadges(d.badges) }).catch(() => {})
    fetch(`/api/follows?user_id=${user.id}`).then((r) => r.json()).then((d) => setFollowCounts({ followers: d.followers ?? 0, following: d.following ?? 0 })).catch(() => {})
  }, [user?.id])

  useEffect(() => {
    if (!isEditingName) setNameDraft(displayName)
  }, [displayName, isEditingName])

  useEffect(() => {
    if (!isEditingBio) setBioDraft(bio)
  }, [bio, isEditingBio])

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus()
  }, [isEditingName])

  useEffect(() => {
    if (isEditingBio) bioInputRef.current?.focus()
  }, [isEditingBio])

  const startEditingName = () => {
    setNameDraft(displayName)
    setIsEditingName(true)
  }

  const cancelEditingName = () => {
    setNameDraft(displayName)
    setIsEditingName(false)
  }

  const commitDisplayName = async () => {
    const ok = await setDisplayName(nameDraft)
    if (!ok) {
      toast({
        title: "Name required",
        description: "Please enter at least one character.",
        variant: "destructive",
      })
      return
    }
    setIsEditingName(false)
    toast({ title: "Name saved", description: "Your name is saved to your account." })
  }

  const startEditingBio = () => {
    setBioDraft(bio)
    setIsEditingBio(true)
  }

  const cancelEditingBio = () => {
    setBioDraft(bio)
    setIsEditingBio(false)
  }

  const commitBio = async () => {
    const ok = await setBio(bioDraft)
    if (!ok) {
      toast({
        title: "Could not save bio",
        description: "Please try again.",
        variant: "destructive",
      })
      return
    }
    setIsEditingBio(false)
    toast({ title: "Bio saved", description: "Your bio is saved to your account." })
  }

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return
    const ok = await uploadAvatar(file)
    if (ok) {
      toast({ title: "Photo updated", description: "Your profile picture is saved." })
    } else {
      toast({
        title: "Upload failed",
        description: "Use a JPEG, PNG, or WebP under 2 MB.",
        variant: "destructive",
      })
    }
    if (avatarInputRef.current) avatarInputRef.current.value = ""
  }
  const stats = [
    { value: `${feedPosts.length}`, label: "POSTS" },
    { value: `${followCounts.followers}`, label: "FOLLOWERS" },
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
      repurchased: shelfProducts.filter((product) => product.is_repurchase).slice(0, 4),
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
    const bioLine = bio ? `${bio} ` : ""
    const text = `${displayName}'s Pickly routine. ${bioLine}Discover it on Pickly. ${url}`

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
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => void handleAvatarFile(e.target.files?.[0])}
              />
              <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} size="lg" className="bg-[#E8E2D8]" />
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#697254] disabled:opacity-60"
                aria-label="Change profile photo"
              >
                {isUploadingAvatar ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </button>
            </div>

            <motion.div layout className="flex min-h-[28px] items-center justify-center gap-2 px-2">
              {isEditingName ? (
                <>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={nameDraft}
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitDisplayName()
                      if (e.key === "Escape") cancelEditingName()
                    }}
                    className="w-[min(220px,70vw)] rounded-xl border border-[#A7AD89]/40 bg-[#FAFBF6] px-3 py-1.5 text-center text-lg font-bold text-[#2D2D2D] outline-none ring-[#697254] focus:ring-2"
                    aria-label="Display name"
                  />
                  <button
                    type="button"
                    onClick={commitDisplayName}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#697254] text-white transition-opacity hover:opacity-90"
                    aria-label="Save name"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditingName}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E2D8] text-[#697254] transition-opacity hover:opacity-90"
                    aria-label="Cancel editing name"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startEditingName}
                  className="group flex items-center gap-1.5 rounded-xl px-2 py-0.5 transition-colors hover:bg-[#F5EFE6]"
                  aria-label="Edit display name"
                >
                  <h2 className="text-lg font-bold text-[#2D2D2D]">{displayName}</h2>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-[#697254]/50 transition-colors group-hover:bg-[#A7AD89]/15 group-hover:text-[#697254]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </span>
                </button>
              )}
            </motion.div>

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

            {isEditingBio ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full max-w-[280px] space-y-2"
              >
                <textarea
                  ref={bioInputRef}
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value.slice(0, MAX_BIO_LENGTH))}
                  rows={3}
                  placeholder={DEFAULT_BIO_PLACEHOLDER}
                  className="w-full resize-none rounded-2xl border border-[#A7AD89]/40 bg-[#FAFBF6] px-3 py-2.5 text-center text-[13px] leading-relaxed text-[#2D2D2D] outline-none ring-[#697254] focus:ring-2"
                  aria-label="Profile bio"
                />
                <p className="text-center text-[10px] text-[#92735C]/50">{bioDraft.length}/{MAX_BIO_LENGTH}</p>
                <motion.div layout className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={commitBio}
                    className="rounded-full bg-[#697254] px-4 py-1.5 text-[11px] font-bold text-white"
                  >
                    Save bio
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditingBio}
                    className="rounded-full bg-[#E8E2D8] px-4 py-1.5 text-[11px] font-bold text-[#697254]"
                  >
                    Cancel
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={startEditingBio}
                className="group mt-4 max-w-[280px] rounded-xl px-2 py-1 text-center transition-colors hover:bg-[#F5EFE6]"
                aria-label="Edit profile bio"
              >
                <p
                  className={`text-[13px] leading-relaxed ${
                    bio ? "text-[#92735C]/80" : "text-[#92735C]/45 italic"
                  }`}
                >
                  {bio || DEFAULT_BIO_PLACEHOLDER}
                </p>
                <span className="mt-1 inline-block text-[10px] font-semibold text-[#697254]/40 opacity-0 transition-opacity group-hover:opacity-100">
                  Tap to edit
                </span>
              </button>
            )}
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
              {feedPosts.length === 0 && (
                <p className="py-8 text-center text-[13px] text-[#92735C]/60">No posts yet. Share your first routine or scan!</p>
              )}
              {feedPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease }}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3 p-4 pb-3">
                    <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} size="sm" />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#2D2D2D]">{displayName}</p>
                      <p className="text-[11px] text-[#92735C]/50">{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                  <p className="px-4 pb-3 text-[13px] leading-relaxed text-[#2D2D2D]/85">{post.body}</p>
                  {post.image_path && (
                    <div className="relative h-48 w-full bg-[#E8E2D8]">
                      <Image src={post.image_path} alt="Post" fill className="object-cover" />
                    </div>
                  )}
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
                  bio={bio}
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
                    key={badge.code}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: badge.earned ? 1 : 0.45, scale: 1 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease }}
                    className={`flex flex-col items-center rounded-2xl p-4 text-center ${badge.earned ? "bg-white shadow-sm" : "bg-white/60"}`}
                  >
                    <span className="mb-2 text-2xl">{badge.icon}</span>
                    <p className="text-[11px] font-bold leading-tight text-[#2D2D2D]">{badge.name}</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-[#92735C]/60">{badge.description}</p>
                    {badge.earned && (
                      <div className="mt-2 rounded-full bg-[#A7AD89]/20 px-2 py-0.5">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#697254]">Earned</span>
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
