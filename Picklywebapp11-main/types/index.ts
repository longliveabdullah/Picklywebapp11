export type User = {
  id: string
  email: string
  onboardingComplete: boolean
  profile: UserProfile
}

export type UserProfile = {
  age?: number
  gender?: "male" | "female" | "other" | "prefer-not-to-say"
  height?: number // in cm
  weight?: number // in kg
  hasDiabetes?: boolean
  allergies?: string[]
  skinType?: "normal" | "oily" | "dry" | "combination" | "sensitive"
  skinTone?: "fair" | "light" | "medium" | "tan" | "dark" | "deep"
  skinConcerns?: string[]
  scalpType?: "normal" | "dry" | "oily" | "sensitive"
  hairConditions?: string[]
  goals?: string[] // e.g., ["weight_loss", "muscle_gain", "skin_health", "hair_health"]
}

export type ProductRating = {
  rating: number
  productName: string
  explanation: string
  recommendations: string[]
  healthScore: number
  suitabilityScore: number
  reasonsToBuy: string[]
  reasonsToAvoid: string[]
  summary: string
}

export type ScanHistoryItem = {
  id: string
  imageUrl: string
  productName?: string
  rating: ProductRating
  scannedAt: Date
  userProfile: UserProfile
}

export type ScanHistory = ScanHistoryItem[]
