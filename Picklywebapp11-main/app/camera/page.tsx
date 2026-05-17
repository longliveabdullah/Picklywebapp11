"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Trans, useTranslation } from "react-i18next"
import { getAppLocale } from "@/lib/i18n"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  ArrowRight,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Layers3,
  RefreshCw,
  Send,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Upload,
} from "@/lib/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PriceSearch } from "@/components/PriceSearch"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useSharedRoutine } from "@/hooks/use-shared-routine"
import { useSharedShelf } from "@/hooks/use-shared-shelf"
import { useToast } from "@/hooks/use-toast"
import { mapEnvelopeToProductRating } from "@/lib/map-envelope-to-product-rating"
import type { PicklyApiEnvelope } from "@/lib/pickly-analyze/schema"
import {
  buildScanResultViewModel,
  buildShelfDraft,
  type HeroTheme,
  type ResultActionId,
  type ResultMode,
} from "@/lib/scan-result-view-model"
import { ScanLimitService } from "@/lib/scan-limit-service"
import { routineTypeMeta, type RoutineSelection, type SharedShelfProduct } from "@/lib/pickly-mock-data"
import type { ProductRating } from "@/types"

const ease = [0.22, 1, 0.36, 1] as const

function isPicklyEnvelope(payload: unknown): payload is PicklyApiEnvelope {
  if (!payload || typeof payload !== "object") return false
  const candidate = payload as Record<string, unknown>
  const result = candidate.result
  return typeof candidate.request_id === "string" && !!result && typeof result === "object"
}

function shelfCompactPayload(products: SharedShelfProduct[]) {
  return products.slice(0, 8).map((product) => ({
    product_name: product.product_name,
    brand: product.brand,
    category: product.category,
    routine_type: product.routine_type ?? null,
  }))
}

function routineCompactPayload(routine: { am: RoutineSelection[]; pm: RoutineSelection[] }, shelfProducts: SharedShelfProduct[]) {
  const formatPeriod = (steps: RoutineSelection[]) =>
    steps
      .map((step) => {
        const label = routineTypeMeta[step.type].label
        const match = shelfProducts.find((product) => product.id === step.productId)
        return match ? `${label}: ${match.product_name}` : label
      })
      .join(" > ")

  return {
    am: formatPeriod(routine.am),
    pm: formatPeriod(routine.pm),
  }
}

const heroThemeClasses: Record<
  HeroTheme,
  {
    pageBg: string
    pageGlow: string
    pageAura: string
    stickySurface: string
    surface: string
    halo: string
    border: string
    badge: string
    accent: string
    muted: string
    solidButton: string
    outlineButton: string
    softBlock: string
    ring: string
    header: string
  }
> = {
  terracotta: {
    pageBg: "from-[#EBC5B6] via-[#F5E6DE] to-[#FBF4EE]",
    pageGlow: "bg-[radial-gradient(circle_at_top,_rgba(199,121,89,0.28),_transparent_58%)]",
    pageAura: "bg-[radial-gradient(circle_at_80%_20%,_rgba(216,157,132,0.32),_transparent_34%)]",
    stickySurface: "bg-[#FFF8F4]/92 border-[#E7CABC]",
    surface: "from-[#F7E5DD] via-[#F5EFE6] to-[#FBF4EE]",
    halo: "from-[#C77959] via-[#D89D84] to-[#F0C9B6]",
    border: "border-[#E6C6B6]",
    badge: "bg-white/80 text-[#8B513A]",
    accent: "text-[#8B513A]",
    muted: "text-[#8B513A]/75",
    solidButton: "bg-[#8B513A] text-[#FFF7F3] hover:bg-[#744330]",
    outlineButton: "border-[#DAB19E] text-[#8B513A] hover:bg-[#F8ECE5]",
    softBlock: "bg-[#FFF7F2]",
    ring: "ring-[#C77959]/20",
    header: "bg-[#8B513A]",
  },
  amber: {
    pageBg: "from-[#F2DBA8] via-[#F6ECDD] to-[#FFF9F0]",
    pageGlow: "bg-[radial-gradient(circle_at_top,_rgba(213,166,85,0.24),_transparent_58%)]",
    pageAura: "bg-[radial-gradient(circle_at_80%_20%,_rgba(245,227,183,0.35),_transparent_36%)]",
    stickySurface: "bg-[#FFFBEF]/92 border-[#EAD8B4]",
    surface: "from-[#FAF0DF] via-[#F5EFE6] to-[#FFF9F0]",
    halo: "from-[#D5A655] via-[#E2C388] to-[#F5E3B7]",
    border: "border-[#E8D6B0]",
    badge: "bg-white/80 text-[#8B6A2B]",
    accent: "text-[#8B6A2B]",
    muted: "text-[#8B6A2B]/75",
    solidButton: "bg-[#8B6A2B] text-[#FFF9EF] hover:bg-[#735623]",
    outlineButton: "border-[#D9C18B] text-[#8B6A2B] hover:bg-[#FAF3E4]",
    softBlock: "bg-[#FFF9EF]",
    ring: "ring-[#D5A655]/20",
    header: "bg-[#8B6A2B]",
  },
  sage: {
    pageBg: "from-[#D9E2C8] via-[#EEF2E5] to-[#FBFCF7]",
    pageGlow: "bg-[radial-gradient(circle_at_top,_rgba(143,161,122,0.25),_transparent_58%)]",
    pageAura: "bg-[radial-gradient(circle_at_80%_20%,_rgba(175,190,153,0.3),_transparent_35%)]",
    stickySurface: "bg-[#FAFBF6]/92 border-[#D6DFCB]",
    surface: "from-[#EEF2E5] via-[#F5EFE6] to-[#FBFCF7]",
    halo: "from-[#8FA17A] via-[#AFBE99] to-[#D9E2C8]",
    border: "border-[#D6DFCB]",
    badge: "bg-white/80 text-[#5F6B4F]",
    accent: "text-[#5F6B4F]",
    muted: "text-[#5F6B4F]/75",
    solidButton: "bg-[#697254] text-[#F5EFE6] hover:bg-[#576046]",
    outlineButton: "border-[#C6D2B7] text-[#5F6B4F] hover:bg-[#F3F7EC]",
    softBlock: "bg-[#FAFBF6]",
    ring: "ring-[#8FA17A]/20",
    header: "bg-[#697254]",
  },
  green: {
    pageBg: "from-[#D1EAD3] via-[#EAF5E8] to-[#F7FCF5]",
    pageGlow: "bg-[radial-gradient(circle_at_top,_rgba(125,180,139,0.26),_transparent_58%)]",
    pageAura: "bg-[radial-gradient(circle_at_80%_20%,_rgba(159,204,168,0.32),_transparent_36%)]",
    stickySurface: "bg-[#F8FDF7]/92 border-[#CFE3D1]",
    surface: "from-[#EAF5E8] via-[#F5EFE6] to-[#F7FCF5]",
    halo: "from-[#7DB48B] via-[#9FCCA8] to-[#D1EAD3]",
    border: "border-[#CFE3D1]",
    badge: "bg-white/80 text-[#4E7657]",
    accent: "text-[#4E7657]",
    muted: "text-[#4E7657]/75",
    solidButton: "bg-[#4E7657] text-[#F7FBF5] hover:bg-[#416248]",
    outlineButton: "border-[#BCD8C1] text-[#4E7657] hover:bg-[#F0F8F0]",
    softBlock: "bg-[#F6FBF5]",
    ring: "ring-[#7DB48B]/20",
    header: "bg-[#4E7657]",
  },
  neutral: {
    pageBg: "from-[#E9E2D8] via-[#F5EFE6] to-[#FCF9F5]",
    pageGlow: "bg-[radial-gradient(circle_at_top,_rgba(182,169,155,0.22),_transparent_58%)]",
    pageAura: "bg-[radial-gradient(circle_at_80%_20%,_rgba(206,195,183,0.28),_transparent_35%)]",
    stickySurface: "bg-[#FFFDF9]/92 border-[#E6DDD2]",
    surface: "from-[#F7F2EB] via-[#F5EFE6] to-[#FCF9F5]",
    halo: "from-[#B6A99B] via-[#CEC3B7] to-[#E9E2D8]",
    border: "border-[#E6DDD2]",
    badge: "bg-white/80 text-[#6E6458]",
    accent: "text-[#6E6458]",
    muted: "text-[#6E6458]/75",
    solidButton: "bg-[#6E6458] text-[#F7F2EB] hover:bg-[#5A5248]",
    outlineButton: "border-[#D8CEC2] text-[#6E6458] hover:bg-[#F8F2EB]",
    softBlock: "bg-[#FFFDF9]",
    ring: "ring-[#B6A99B]/20",
    header: "bg-[#6E6458]",
  },
}

const similarityToneClasses = {
  positive: "border-[#D8E5D0] bg-[#F8FBF5] text-[#5A6A4B]",
  caution: "border-[#E8D8B8] bg-[#FFF9EF] text-[#8B6A2B]",
  neutral: "border-[#E7DCD0] bg-[#FCF8F3] text-[#6E6458]",
}

const loadingCopyByMode: Record<
  ResultMode,
  {
    eyebrow: string
    description: string
    steps: string[]
  }
> = {
  in_store: {
    eyebrow: "Pickly Now",
    description: "Pickly is getting you a fast, in-store answer — what to do right now, not a long report.",
    steps: ["Reading the label", "Checking your profile fit", "Building your quick call"],
  },
  researching: {
    eyebrow: "Pickly Deep",
    description: "Pickly is putting together a fuller picture so you know more before you buy.",
    steps: ["Reading the label", "Checking your profile match", "Preparing the deeper breakdown"],
  },
}

interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export default function CameraPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const { products: shelfProducts, addProduct } = useSharedShelf()
  const { routine } = useSharedRoutine()
  const [isScanning, setIsScanning] = useState(false)
  const [productRating, setProductRating] = useState<ProductRating | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remainingScans, setRemainingScans] = useState<number>(3)
  const [loadingScans, setLoadingScans] = useState(true)
  const [showEvidence, setShowEvidence] = useState(false)
  const [showScoreReveal, setShowScoreReveal] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const lastScanBase64Ref = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const routineFitRef = useRef<HTMLDivElement>(null)
  const evidenceRef = useRef<HTMLDivElement>(null)
  const assistantRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const uiResultMode = useMemo<ResultMode>(() => {
    return productRating?.picklyEnvelope?.result.mode === "research" ? "researching" : "in_store"
  }, [productRating])

  const viewModel = useMemo(
    () =>
      productRating
        ? buildScanResultViewModel(productRating, user?.profile, shelfProducts, routine, uiResultMode)
        : null,
    [productRating, uiResultMode, routine, shelfProducts, user?.profile],
  )

  const priceSearchProduct = useMemo(() => {
    const result = productRating?.picklyEnvelope?.result
    if (!result) return null

    const productName = result?.productName?.trim()
    const brand = result?.brand?.trim()

    if (!productName || !brand) return null
    if (brand.toLowerCase() === "unknown" || productName.toLowerCase().includes("unrecognized")) return null

    return {
      productName,
      brand,
      category: result.category,
      fullTitle: `${brand} ${productName}`.trim(),
    }
  }, [productRating])

  const heroTheme = viewModel ? heroThemeClasses[viewModel.heroTheme] : heroThemeClasses.neutral

  const hasExactShelfMatch = useMemo(() => {
    if (!viewModel) return false
    return shelfProducts.some(
      (product) => product.product_name.toLowerCase() === viewModel.productName.toLowerCase(),
    )
  }, [shelfProducts, viewModel])

  const loadingCopy = loadingCopyByMode.in_store

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!viewModel || messages.length > 0) return

    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      content:
        viewModel.mode === "researching"
          ? "Ask me anything before you buy — ingredients, tradeoffs, or whether it is worth it."
          : "In the store? Ask what to do right now and I will keep it short and clear.",
      isUser: false,
      timestamp: new Date(),
    }

    setMessages([welcomeMessage])
    const timer = window.setTimeout(() => setShowChat(true), 650)
    return () => window.clearTimeout(timer)
  }, [messages.length, viewModel])

  useEffect(() => {
    if (!productRating) return
    setShowEvidence(uiResultMode === "researching")
  }, [productRating, uiResultMode])

  useEffect(() => {
    if (!viewModel || isScanning) return

    setShowScoreReveal(true)
    const timer = window.setTimeout(() => setShowScoreReveal(false), 1150)
    return () => window.clearTimeout(timer)
  }, [isScanning, viewModel])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage])

  useEffect(() => {
    const loadRemainingScans = async () => {
      if (!user) {
        setLoadingScans(false)
        return
      }

      try {
        setLoadingScans(true)
        const remaining = await ScanLimitService.getRemainingScans(user.id, user.email)
        setRemainingScans(remaining)
      } catch (loadError) {
        console.error("Error loading remaining scans:", loadError)
        setRemainingScans(3)
      } finally {
        setLoadingScans(false)
      }
    }

    loadRemainingScans()
  }, [user])

  const handleSendMessage = async (overrideMessage?: string) => {
    if (!productRating || isSending) return

    const messageText = (overrideMessage ?? inputMessage).trim()
    if (!messageText) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      isUser: true,
      timestamp: new Date(),
    }

    const conversation = [...messages, userMessage]
    setMessages(conversation)
    setInputMessage("")
    setIsSending(true)
    setIsTyping(true)
    setShowChat(true)

    const assistantMessage: ChatMessage = {
      id: `${Date.now() + 1}`,
      content: "",
      isUser: false,
      timestamp: new Date(),
    }
    setMessages((previous) => [...previous, assistantMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation,
          productData: productRating,
        }),
      })

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""
      let done = false

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk

        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessage.id ? { ...message, content: fullResponse } : message,
          ),
        )
      }
    } catch (chatError) {
      console.error("Chat error:", chatError)
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: "Sorry, I could not answer that right now. Please try again." }
            : message,
        ),
      )
      toast({
        title: "Chat Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTyping(false)
      setIsSending(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    scrollToSection(assistantRef)
    void handleSendMessage(prompt)
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSendMessage()
    }
  }

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to analyze products.",
          variant: "destructive",
        })
        return
      }

      if (remainingScans <= 0) {
        toast({
          title: "Daily Limit Reached",
          description: "You've reached your daily limit of 3 scans. Try again tomorrow!",
          variant: "destructive",
        })
        return
      }

      setIsScanning(true)
      setProductRating(null)
      setError(null)
      setMessages([])
      setShowChat(false)
      setShowEvidence(false)

      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(",")[1])
          reader.onerror = (readerError) => reject(readerError)
          reader.readAsDataURL(file)
        })

        lastScanBase64Ref.current = base64

        const response = await fetch("/api/analyze-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            imageBase64: base64,
            mode: "in_store",
            locale: getAppLocale(),
            client_context: {
              shelf_compact: shelfCompactPayload(shelfProducts),
              routine_compact: routineCompactPayload(routine, shelfProducts),
            },
          }),
        })

        const envelopeUnknown: unknown = await response.json()

        if (!response.ok) {
          const errorData = envelopeUnknown as { error?: string }
          throw new Error(errorData.error || "Analysis failed")
        }

        if (!isPicklyEnvelope(envelopeUnknown)) {
          throw new Error("Unexpected analysis response shape")
        }

        const mapped = mapEnvelopeToProductRating(envelopeUnknown)
        setProductRating(mapped)

        try {
          await ScanLimitService.incrementScanCount(user.id)
          const newRemaining = await ScanLimitService.getRemainingScans(user.id, user.email)
          setRemainingScans(newRemaining)
        } catch (limitError) {
          console.error("Error updating scan count:", limitError)
        }

        toast({
          title: "Analysis Complete",
          description: "Product analyzed successfully!",
        })
      } catch (analysisError) {
        console.error("Analysis error:", analysisError)
        const errorMessage =
          analysisError instanceof Error ? analysisError.message : "An unexpected error occurred."
        setError(errorMessage)
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive",
        })
        setSelectedImage(null)
      } finally {
        setIsScanning(false)
      }
    },
    [remainingScans, routine, shelfProducts, toast, user],
  )

  const handleFullAnalysis = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to analyze products.",
        variant: "destructive",
      })
      return
    }

    const base64 = lastScanBase64Ref.current
    if (!base64) {
      toast({
        title: "Scan a product first",
        description: "Take or upload a photo, then tap Full Analysis.",
        variant: "destructive",
      })
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imageBase64: base64,
          mode: "research",
          locale: clientLocale(),
          client_context: {
            shelf_compact: shelfCompactPayload(shelfProducts),
            routine_compact: routineCompactPayload(routine, shelfProducts),
          },
        }),
      })

      const envelopeUnknown: unknown = await response.json()

      if (!response.ok) {
        const errorData = envelopeUnknown as { error?: string }
        throw new Error(errorData.error || "Analysis failed")
      }

      if (!isPicklyEnvelope(envelopeUnknown)) {
        throw new Error("Unexpected analysis response shape")
      }

      setProductRating(mapEnvelopeToProductRating(envelopeUnknown))

      toast({
        title: "Full analysis ready",
        description: "Pickly Deep is loaded for this scan.",
      })
    } catch (analysisError) {
      console.error("Deep analysis error:", analysisError)
      const errorMessage =
        analysisError instanceof Error ? analysisError.message : "An unexpected error occurred."
      setError(errorMessage)
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }, [routine, shelfProducts, toast, user])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      void handleFileUpload(file)
    }
    event.target.value = ""
  }

  const openImagePicker = (input: HTMLInputElement | null) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to analyze products.",
        variant: "destructive",
      })
      return
    }
    if (isScanning) return
    if (remainingScans <= 0) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached your daily limit of 3 scans. Try again tomorrow!",
        variant: "destructive",
      })
      return
    }
    input?.click()
  }

  const handleCameraClick = () => openImagePicker(cameraInputRef.current)
  const handleGalleryClick = () => openImagePicker(galleryInputRef.current)

  const resetScan = () => {
    setSelectedImage(null)
    setProductRating(null)
    setError(null)
    setMessages([])
    setInputMessage("")
    setShowChat(false)
    setShowEvidence(false)
    setShowScoreReveal(false)
  }

  const handleSaveToShelf = async () => {
    if (!viewModel) return

    if (hasExactShelfMatch) {
      toast({
        title: "Already on your shelf",
        description: `${viewModel.productName} is already saved in your shelf.`,
      })
      return
    }

    try {
      await addProduct(buildShelfDraft(viewModel))
      toast({
        title: "Saved to shelf",
        description: `${viewModel.productName} is now part of your shelf.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Could not save",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleResultAction = (actionId: ResultActionId) => {
    switch (actionId) {
      case "save_to_shelf":
        handleSaveToShelf()
        return
      case "routine_fit":
        scrollToSection(routineFitRef)
        return
      case "compare_with_shelf":
        router.push("/products")
        return
      case "safer_alternative":
        handleQuickPrompt("Suggest a safer alternative for my profile.")
        return
      case "why_unsafe":
        setShowEvidence(true)
        window.setTimeout(() => scrollToSection(evidenceRef), 60)
        return
      case "complete_profile":
        router.push("/profile")
        return
      case "use_now":
        handleQuickPrompt("Can I still use this sometimes and if so how often?")
        return
      case "scan_again":
        resetScan()
        return
    }
  }

  const goBack = () => {
    router.push("/home")
  }

  const isLimitReached = remainingScans <= 0
  const isButtonDisabled = isScanning || isLimitReached

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="flex min-h-screen flex-col">
        {!selectedImage ? (
          <div className="relative flex min-h-screen flex-col">
            <div className="absolute inset-0">
              <Image
                src="/images/0f9c5cd86b8fac5258bbf4f4d4312d01.jpg"
                alt=""
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#697254]/60 via-[#4D5A3C]/40 to-[#2D3A20]/80" />
            </div>

            <motion.header
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="relative z-10 flex items-center justify-between px-5 pb-3 pt-5"
            >
              <button
                onClick={goBack}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M13 16L7 10L13 4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <span className="text-[16px] font-extrabold uppercase tracking-wide text-white">Pickly</span>

              <button
                onClick={() => router.push("/profile")}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </motion.header>

            <div className="flex-1" />

            <div className="relative z-10 px-5 pb-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15, ease }}
                className="overflow-hidden rounded-3xl border border-white/20 bg-white/15 p-6 backdrop-blur-xl shadow-2xl"
              >
                <div className="mb-5 text-center">
                  <h1 className="text-[22px] font-bold text-white">{t("camera.title")}</h1>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
                    {t("camera.subtitle")}
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.25, ease }}
                  className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A7AD89]/40">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  {loadingScans ? (
                    <p className="text-sm font-medium text-white/80">{t("common.loading")}</p>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{t("camera.scansLeft", { count: remainingScans })}</p>
                      {remainingScans === 0 && <p className="mt-0.5 text-[11px] text-white/50">{t("camera.resetsMidnight")}</p>}
                    </div>
                  )}
                </motion.div>

                <div className="mb-5 rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{t("camera.picklyNowFirst")}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-white/60">
                    <Trans
                      i18nKey="camera.picklyNowDesc"
                      components={{
                        1: <span className="font-semibold text-white/85" />,
                      }}
                    />
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3">
                    <p className="text-sm text-red-100">{error}</p>
                  </div>
                )}

                {isLimitReached && !error && (
                  <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/20 px-4 py-3">
                    <p className="text-sm text-amber-100">{t("camera.dailyLimit")}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCameraClick}
                    disabled={isButtonDisabled}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#697254] py-4 text-[15px] font-semibold text-[#EFE5D8] shadow-lg transition-all duration-200 disabled:opacity-40"
                  >
                    <Camera className="h-5 w-5" />
                    {t("camera.takePhoto")}
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.38, ease }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGalleryClick}
                    disabled={isButtonDisabled}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/10 py-4 text-[15px] font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 disabled:opacity-40"
                  >
                    {isScanning ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t("camera.analyzing")}
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        {t("camera.uploadPhoto")}
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {!loadingScans && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-4 flex items-center justify-center gap-2"
                >
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        index < remainingScans ? "bg-[#A7AD89]" : "bg-white/20"
                      }`}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className={`relative mx-auto min-h-screen max-w-md overflow-hidden bg-gradient-to-b ${heroTheme.pageBg} pb-40 transition-colors duration-700`}>
            <div className={`pointer-events-none absolute inset-0 ${heroTheme.pageGlow}`} />
            <div className={`pointer-events-none absolute inset-0 ${heroTheme.pageAura}`} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/18 to-transparent" />
            <AnimatePresence>
              {showScoreReveal && (
                <motion.div
                  key="score-reveal-overlay"
                  initial={{ opacity: 0, backdropFilter: "blur(18px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(28px)" }}
                  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: 0.72, ease }}
                  className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
                >
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0.55 }}
                    animate={{ scale: 1.08, opacity: 1 }}
                    exit={{ scale: 1.14, opacity: 0 }}
                    transition={{ duration: 0.78, ease }}
                    className={`absolute inset-0 bg-gradient-to-br ${heroTheme.surface}`}
                  />
                  <motion.div
                    initial={{ x: "-18%", opacity: 0.2, filter: "blur(36px)" }}
                    animate={{ x: "12%", opacity: 0.55, filter: "blur(54px)" }}
                    exit={{ x: "22%", opacity: 0, filter: "blur(70px)" }}
                    transition={{ duration: 0.8, ease }}
                    className={`absolute -left-16 top-16 h-72 w-72 rounded-full bg-gradient-to-br ${heroTheme.halo}`}
                  />
                  <motion.div
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.52, ease }}
                    className="absolute inset-x-8 top-[28%] text-center"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6B6257]/70">
                      Pickly reveal
                    </p>
                    <h2 className="mt-4 text-[30px] font-bold leading-[1.02] text-[#2D2D2D]">
                      Don&apos;t just pick.
                      <br />
                      Pickly.
                    </h2>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-between px-5 pt-5">
              <button
                onClick={resetScan}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#92735C]/10"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M13 16L7 10L13 4"
                    stroke="#3D3D3D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <Image
                src="/images/pickly-newlogov2.png"
                alt="Pickly"
                width={30}
                height={30}
                className="rounded-full"
              />
              <div className="w-10" />
            </div>

            <div className="relative space-y-4 px-4 pb-8 pt-4">
              <AnimatePresence mode="wait">
              {isScanning || !viewModel ? (
                <motion.div
                  key="scan-loading"
                  initial={{ opacity: 0, y: 12, scale: 0.985, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, scale: 1.01, filter: "blur(18px)" }}
                  transition={{ duration: 0.55, ease }}
                >
                  <Card className="loading-card-shimmer relative overflow-hidden rounded-[30px] border-[#E8DDD2] bg-white/75 shadow-none backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-[#F5EFE6]/85 to-white/75" />
                    <div className="loading-orb absolute -left-10 top-10 h-36 w-36 rounded-full bg-[#A7AD89]/22 blur-3xl" />
                    <div className="loading-orb delay-300 absolute right-[-24px] top-1/3 h-40 w-40 rounded-full bg-[#B69C85]/22 blur-3xl" />
                    <div className="loading-orb delay-500 absolute bottom-6 left-1/3 h-32 w-32 rounded-full bg-[#DBD0C4]/35 blur-3xl" />

                    <CardContent className="relative p-0">
                      <div className="relative aspect-[1.08] overflow-hidden">
                        <img
                          src={selectedImage || "/placeholder.svg"}
                          alt="Analyzed product"
                          className="h-full w-full scale-105 object-cover opacity-40 blur-[1px]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#F5EFE6] via-[#F5EFE6]/35 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-[#A7AD89]/10" />

                        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5">
                          <Badge className="border-0 bg-white/75 text-[#6B6257]">{loadingCopy.eyebrow}</Badge>
                          <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#697254] shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-[#697254] animate-pulse" />
                            Pickly is thinking
                          </div>
                        </div>

                        <div className="absolute inset-x-5 bottom-5 rounded-[28px] border border-white/70 bg-white/62 p-5 shadow-[0_18px_40px_rgba(61,45,37,0.08)] backdrop-blur-md">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#92735C]/55">
                            Smart scan in progress
                          </p>
                          <h2 className="mt-3 text-[30px] font-bold leading-[1.02] text-[#2D2D2D]">
                            Don&apos;t just pick.
                            <br />
                            Pickly.
                          </h2>
                          <p className="mt-3 text-[13px] leading-relaxed text-[#6B6257]">
                            {loadingCopy.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 px-5 py-5">
                        <div className="grid gap-2.5">
                          {loadingCopy.steps.map((step, index) => (
                            <div key={step} className="flex items-center gap-3 rounded-2xl bg-[#FCF8F3] px-4 py-3">
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#697254] shadow-sm"
                                style={{ animationDelay: `${index * 0.12}s` }}
                              >
                                {index + 1}
                              </div>
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#A7AD89] animate-pulse" />
                                <p className="text-[13px] font-medium text-[#2D2D2D]/85">{step}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-[#E7DDD0] bg-white/80 px-4 py-3 text-center">
                          <p className="text-[12px] font-semibold text-[#6B6257]">
                            Your score will arrive with context, not just a number.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="scan-result"
                  initial={{ opacity: 0, y: 18, scale: 0.992, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, scale: 1.01, filter: "blur(8px)" }}
                  transition={{ duration: 0.62, ease }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease }}
                    className="rounded-[26px] border border-[#E8DDD2] bg-white/90 p-4 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#92735C]/55">
                          Depth control
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-[#6B6257]">
                          Pickly keeps your first pass fast. Use Full Analysis when you want shelf context, routine fit, and richer reasoning on{" "}
                          <span className="font-semibold text-[#4F473F]">this same scan</span>.
                        </p>
                      </div>
                      {productRating?.picklyEnvelope?.result.mode === "in_store" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 rounded-xl border-[#D9CBBF] text-[#5F554C]"
                          disabled={isScanning}
                          onClick={() => void handleFullAnalysis()}
                        >
                          Full Analysis
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.985, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.65, ease }}
                    className={`relative overflow-hidden rounded-[30px] border ${heroTheme.border} bg-gradient-to-br ${heroTheme.surface}`}
                  >
                    <div className="score-reveal-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2" />
                    <div className={`absolute -right-10 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${heroTheme.halo} blur-2xl`} />
                    <div className="relative px-5 pb-5 pt-5">
                      <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge className={`border-0 ${heroTheme.badge}`}>{viewModel.modeLabel}</Badge>
                            <Badge className={`border-0 ${heroTheme.badge}`}>{viewModel.categoryLabel}</Badge>
                          </div>

                          {viewModel.verdict === "danger" && (
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C45B4A]">
                              Risk-first result
                            </p>
                          )}

                          <h1 className="mt-2 text-[28px] font-bold leading-tight text-[#2D2D2D]">
                            {viewModel.verdict === "danger" ? "Pause on this one" : viewModel.productName}
                          </h1>
                          {viewModel.verdict === "danger" && (
                            <p className="mt-2 text-sm text-[#6B6257]">{viewModel.productName}</p>
                          )}

                          <p className={`mt-4 text-2xl font-bold ${heroTheme.accent}`}>{viewModel.verdictTitle}</p>
                          <p className={`mt-2 text-sm leading-relaxed ${heroTheme.muted}`}>{viewModel.verdictSubtitle}</p>
                        </div>

                        <div
                          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-white/80 shadow-sm ring-8 ${heroTheme.ring}`}
                        >
                          <div className="text-center">
                            <p className="text-[28px] font-bold text-[#2D2D2D]">
                              {viewModel.displayScore.split("/")[0]}
                            </p>
                            <p className="text-[12px] font-semibold text-[#92735C]">
                              {viewModel.displayScore.includes("/") ? "/10" : "scan"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={`mt-5 overflow-hidden rounded-[26px] border border-white/80 ${heroTheme.softBlock}`}>
                        <div className="grid grid-cols-[96px,1fr] items-stretch">
                          <div className="h-full overflow-hidden">
                            <img
                              src={selectedImage || "/placeholder.svg"}
                              alt={viewModel.productName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="px-4 py-3.5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#92735C]/50">
                              What to do right now
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#2D2D2D]">{viewModel.immediateAction}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {priceSearchProduct && (
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.42, delay: 0.04, ease }}
                    >
                      <PriceSearch
                        productName={priceSearchProduct.productName}
                        brand={priceSearchProduct.brand}
                        category={priceSearchProduct.category}
                        fullTitle={priceSearchProduct.fullTitle}
                        locale={getAppLocale()}
                      />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: 0.05, ease }}
                  >
                    <Card className="rounded-[28px] border-[#E8DDD2] bg-white shadow-none">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#697254]/10">
                            <Sparkles className="h-5 w-5 text-[#697254]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-bold text-[#2D2D2D]">Why this score for you</p>
                            <p className="mt-1 text-[13px] leading-relaxed text-[#6B6257]">
                              Consequence-first, profile-aware reasoning above the fold.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {viewModel.personalizedReasons.map((reason) => (
                            <div key={reason} className="flex items-start gap-3 rounded-2xl bg-[#F8F3EE] p-3.5">
                              <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${heroTheme.header}`} />
                              <p className="text-[13px] leading-relaxed text-[#2D2D2D]/85">{reason}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {viewModel.shelfSimilarity && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.42, delay: 0.08, ease }}
                    >
                      <Card
                        className={`rounded-[28px] border shadow-none ${similarityToneClasses[viewModel.shelfSimilarity.tone]}`}
                      >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/65">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-lg font-bold">{viewModel.shelfSimilarity.title}</p>
                            {viewModel.shelfSimilarity.matchedProductName && (
                              <p className="mt-1 text-[12px] font-semibold text-[#2D2D2D]/70">
                                {viewModel.shelfSimilarity.matchedProductName}
                              </p>
                            )}
                            <p className="mt-2 text-[13px] leading-relaxed">{viewModel.shelfSimilarity.message}</p>
                          </div>
                        </div>
                      </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  <motion.div
                    ref={routineFitRef}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: 0.11, ease }}
                  >
                    <Card className="rounded-[28px] border-[#E8DDD2] bg-white shadow-none">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#92735C]/10">
                            <Layers3 className="h-5 w-5 text-[#92735C]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-bold text-[#2D2D2D]">Routine Fit</p>
                            <p className="mt-1 text-[13px] leading-relaxed text-[#6B6257]">
                              {viewModel.routineFit.slotLabel}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-[13px] leading-relaxed text-[#2D2D2D]/85">
                          {viewModel.routineFit.message}
                        </p>

                        {viewModel.routineFit.timeline.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {viewModel.routineFit.timeline.map((step) => (
                              <div
                                key={step.label}
                                className={`rounded-2xl border px-3 py-3 ${
                                  step.active
                                    ? "border-[#D4C6B7] bg-[#F8F3EE]"
                                    : "border-[#EFE6DB] bg-[#FFFDFC]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[12px] font-semibold text-[#2D2D2D]">{step.label}</p>
                                  {step.active && (
                                    <span className="rounded-full bg-[#697254]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#697254]">
                                      Best slot
                                    </span>
                                  )}
                                </div>
                                {step.productName && (
                                  <p className="mt-1 text-[11px] leading-relaxed text-[#92735C]/65">{step.productName}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    ref={evidenceRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: 0.14, ease }}
                  >
                    <Card className="rounded-[28px] border-[#E8DDD2] bg-white shadow-none">
                      <CardContent className="p-5">
                        <button
                          type="button"
                          onClick={() => setShowEvidence((current) => !current)}
                          className="flex w-full items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 text-left">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DBD0C4]/45">
                              <FileText className="h-5 w-5 text-[#92735C]" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-[#2D2D2D]">Evidence</p>
                              <p className="mt-1 text-[13px] leading-relaxed text-[#6B6257]">
                                Expand for reasons to buy, reasons to avoid, the summary, and the profile inputs used.
                              </p>
                            </div>
                          </div>
                          {showEvidence ? (
                            <ChevronUp className="h-5 w-5 shrink-0 text-[#92735C]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 shrink-0 text-[#92735C]" />
                          )}
                        </button>

                        {showEvidence && (
                          <div className="mt-4 space-y-4">
                            {viewModel.reasonsToBuy.length > 0 && (
                              <div className="rounded-2xl border border-[#D9E5D1] bg-[#F7FBF5] p-4">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#697254]/60">
                                  Reasons to buy
                                </p>
                                <div className="mt-3 space-y-2">
                                  {viewModel.reasonsToBuy.map((reason) => (
                                    <p key={reason} className="text-[13px] leading-relaxed text-[#2D2D2D]/85">
                                      • {reason}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {viewModel.reasonsToAvoid.length > 0 && (
                              <div className="rounded-2xl border border-[#E7D0C6] bg-[#FDF7F2] p-4">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C45B4A]/70">
                                  Reasons to avoid
                                </p>
                                <div className="mt-3 space-y-2">
                                  {viewModel.reasonsToAvoid.map((reason) => (
                                    <p key={reason} className="text-[13px] leading-relaxed text-[#2D2D2D]/85">
                                      • {reason}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="rounded-2xl border border-[#E7DDD0] bg-[#FCF8F3] p-4">
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#92735C]/60">
                                Summary
                              </p>
                              <p className="mt-3 text-[13px] leading-relaxed text-[#2D2D2D]/85">
                                {viewModel.evidenceSummary}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-[#E7DDD0] bg-[#FFFCF8] p-4">
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#92735C]/60">
                                Ingredient detail
                              </p>
                              <p className="mt-3 text-[13px] leading-relaxed text-[#6B6257]">
                                Structured ingredient flags will live here as soon as the scan response returns ingredient-level data.
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: 0.17, ease }}
                  >
                    <Card className="rounded-[28px] border-[#E8DDD2] bg-white shadow-none">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#697254]/10">
                            <ShieldAlert className="h-5 w-5 text-[#697254]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-bold text-[#2D2D2D]">What Pickly used from your profile</p>
                            <p className="mt-1 text-[13px] leading-relaxed text-[#6B6257]">
                              Trust goes up when the score clearly feels like yours.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          {viewModel.profileUsage.used.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {viewModel.profileUsage.used.map((label) => (
                                <span
                                  key={label}
                                  className="rounded-full bg-[#697254]/10 px-3 py-1.5 text-[11px] font-semibold text-[#697254]"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[13px] text-[#6B6257]">
                              This result is still mostly general because your profile is lightly filled in.
                            </p>
                          )}
                        </div>

                        {viewModel.profileUsage.missing.length > 0 && (
                          <div className="mt-4 rounded-2xl bg-[#F8F3EE] p-4">
                            <p className="text-[12px] font-semibold text-[#2D2D2D]">
                              Complete {Math.min(viewModel.profileUsage.missing.length, 3)} more inputs to make results sharper
                            </p>
                            <p className="mt-1 text-[12px] leading-relaxed text-[#6B6257]">
                              Missing now: {viewModel.profileUsage.missing.slice(0, 3).join(", ")}
                            </p>
                            <Button
                              onClick={() => router.push("/profile")}
                              variant="outline"
                              className="mt-3 w-full rounded-2xl border-[#D4C6B7] bg-white text-[#2D2D2D]"
                            >
                              Complete Profile
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    ref={assistantRef}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: 0.2, ease }}
                    className={`transition-all duration-700 ${showChat ? "opacity-100" : "opacity-0"}`}
                  >
                    <Card className="overflow-hidden rounded-[28px] border-[#E8DDD2] bg-white shadow-none">
                      <CardContent className="p-0">
                        <div className={`px-5 py-4 text-white ${heroTheme.header}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-base font-bold">Pickly Assistant</p>
                              <p className="text-[12px] text-white/75">
                                Start with the question that matches your moment.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-[#EFE6DB] bg-[#FCF8F3] px-4 py-3">
                          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                            {viewModel.quickPrompts.map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() => handleQuickPrompt(prompt)}
                                className="shrink-0 rounded-full border border-[#D8CEC2] bg-white px-3 py-2 text-[11px] font-semibold text-[#6B6257] transition-colors hover:bg-[#F5EFE6]"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="h-64 overflow-y-auto bg-[#FFFDFC] px-4 py-4">
                          <div className="space-y-3">
                            {messages.map((message) => (
                              <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                                <div
                                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                    message.isUser
                                      ? `${heroTheme.header} rounded-br-md text-white`
                                      : "rounded-bl-md border border-[#EFE6DB] bg-white text-[#2D2D2D]"
                                  }`}
                                >
                                  <p className="text-[13px] leading-relaxed">{message.content}</p>
                                  <p className={`mt-2 text-[11px] ${message.isUser ? "text-white/75" : "text-[#92735C]/55"}`}>
                                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {isTyping && (
                              <div className="flex justify-start">
                                <div className="rounded-2xl rounded-bl-md border border-[#EFE6DB] bg-white px-4 py-3 shadow-sm">
                                  <div className="flex gap-1">
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-[#697254]" />
                                    <div
                                      className="h-2 w-2 animate-bounce rounded-full bg-[#92735C]"
                                      style={{ animationDelay: "0.1s" }}
                                    />
                                    <div
                                      className="h-2 w-2 animate-bounce rounded-full bg-[#DBD0C4]"
                                      style={{ animationDelay: "0.2s" }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div ref={messagesEndRef} />
                          </div>
                        </div>

                        <div className="border-t border-[#EFE6DB] bg-[#FCF8F3] px-4 py-4">
                          <div className="flex items-end gap-3">
                            <textarea
                              ref={textareaRef}
                              value={inputMessage}
                              onChange={(event) => setInputMessage(event.target.value)}
                              onKeyDown={handleKeyPress}
                              placeholder="Ask Pickly what to do with this product..."
                              disabled={isSending}
                              className="min-h-[48px] max-h-[120px] flex-1 resize-none rounded-2xl border border-[#D8CEC2] bg-white px-4 py-3 text-[13px] text-[#2D2D2D] outline-none transition-all focus:border-[#A7AD89] focus:ring-2 focus:ring-[#A7AD89]/25 disabled:cursor-not-allowed disabled:opacity-50"
                              rows={1}
                            />
                            <Button
                              onClick={() => void handleSendMessage()}
                              disabled={!inputMessage.trim() || isSending}
                              className={`h-12 w-12 rounded-2xl p-0 ${heroTheme.solidButton}`}
                            >
                              {isSending ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {viewModel && !isScanning && (
              <div className="fixed inset-x-0 bottom-4 z-30 px-4">
                <div className={`mx-auto max-w-md rounded-[30px] border p-3 shadow-[0_22px_44px_rgba(61,45,37,0.14)] backdrop-blur transition-colors duration-700 ${heroTheme.stickySurface}`}>
                  <div className="grid grid-cols-2 gap-2">
                    {viewModel.actions.map((action) => (
                      <Button
                        key={action.id}
                        onClick={() => handleResultAction(action.id)}
                        variant={action.emphasis === "primary" ? "default" : "outline"}
                        className={`h-auto min-h-[52px] rounded-2xl px-4 py-3 text-[13px] font-semibold whitespace-normal ${
                          action.emphasis === "primary" ? heroTheme.solidButton : heroTheme.outlineButton
                        }`}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={resetScan}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-semibold text-[#92735C]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Scan another product
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
