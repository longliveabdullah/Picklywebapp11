"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Camera, Upload, X, AlertCircle, Clock, Send, ThumbsUp, ThumbsDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ScanLimitService } from "@/lib/scan-limit-service"
import type { ProductRating } from "@/types"

const ease = [0.22, 1, 0.36, 1] as const

interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export default function CameraPage() {
  const { user, addScanToHistory } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [productRating, setProductRating] = useState<ProductRating | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remainingScans, setRemainingScans] = useState<number>(3)
  const [loadingScans, setLoadingScans] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get rating circle colors based on rating
  const getRatingColors = (rating: number) => {
    if (rating < 4) {
      return {
        gradient: "from-red-500 to-red-600",
        border: "border-red-500",
        bg: "from-red-50 to-red-100",
      }
    } else if (rating >= 5 && rating <= 6) {
      return {
        gradient: "from-orange-500 to-orange-600",
        border: "border-orange-500",
        bg: "from-orange-50 to-orange-100",
      }
    } else {
      return {
        gradient: "from-emerald-500 to-teal-500",
        border: "border-emerald-500",
        bg: "from-emerald-50 to-teal-50",
      }
    }
  }

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize chat when product rating is available
  useEffect(() => {
    if (productRating && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `Ask me about your concern of this product`,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])

      // Show chat with animation delay
      setTimeout(() => {
        setShowChat(true)
      }, 1000)
    }
  }, [productRating, messages.length])

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage])

  // Load remaining scans when component mounts or user changes
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
      } catch (error) {
        console.error("Error loading remaining scans:", error)
        setRemainingScans(3)
      } finally {
        setLoadingScans(false)
      }
    }

    loadRemainingScans()
  }, [user])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending || !productRating) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    const newMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage("")
    setIsSending(true)
    setIsTyping(true)

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: "",
      isUser: false,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          productData: productRating,
        }),
      })

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let fullResponse = ""

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk

        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: fullResponse } : msg)),
        )
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "Sorry, I'm having trouble connecting. Please try again." }
            : msg,
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


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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

      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(",")[1])
          reader.onerror = (error) => reject(error)
          reader.readAsDataURL(file)
        })

        const response = await fetch("/api/analyze-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, userProfile: user.profile }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Analysis failed")
        }

        const result: ProductRating = await response.json()
        setProductRating(result)

        try {
          await ScanLimitService.incrementScanCount(user.id)
          const newRemaining = await ScanLimitService.getRemainingScans(user.id, user.email)
          setRemainingScans(newRemaining)
        } catch (limitError) {
          console.error("Error updating scan count:", limitError)
        }

        try {
          await addScanToHistory({
            imageUrl: imageUrl,
            productName: result.productName,
            rating: result,
            userProfile: user.profile,
          })
        } catch (historyError) {
          console.error("Failed to save to history:", historyError)
        }

        toast({
          title: "Analysis Complete",
          description: "Product analyzed successfully!",
        })
      } catch (error) {
        console.error("Analysis error:", error)
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
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
    [user, addScanToHistory, remainingScans, toast],
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    event.target.value = ""
  }

  const handleUploadClick = () => {
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
    fileInputRef.current?.click()
  }

  const resetScan = () => {
    setSelectedImage(null)
    setProductRating(null)
    setError(null)
    setMessages([])
    setShowChat(false)
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
            {/* Background Image + Gradient Overlay */}
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

            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3"
            >
              <button
                onClick={goBack}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13 16L7 10L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <span className="text-[16px] font-extrabold tracking-wide text-white uppercase">Pickly</span>

              <button
                onClick={() => router.push("/profile")}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
              >
                {user?.avatar ? (
                  <Image src={user.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </button>
            </motion.header>

            {/* Spacer to push content down */}
            <div className="flex-1" />

            {/* Main Content — Glassmorphism Card */}
            <div className="relative z-10 px-5 pb-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15, ease }}
                className="overflow-hidden rounded-3xl border border-white/20 bg-white/15 p-6 backdrop-blur-xl shadow-2xl"
              >
                {/* Title */}
                <div className="mb-5 text-center">
                  <h1 className="text-[22px] font-bold text-white">
                    Scan with Pickly
                  </h1>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
                    Point at any product label &amp; get instant insights.
                  </p>
                </div>

                {/* Scan Limit */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.25, ease }}
                  className="mb-5 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A7AD89]/40">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  {loadingScans ? (
                    <p className="text-sm font-medium text-white/80">Loading...</p>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">
                        {remainingScans} of 3 scans left today
                      </p>
                      {remainingScans === 0 && (
                        <p className="mt-0.5 text-[11px] text-white/50">Resets at midnight</p>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Error / Limit Alerts */}
                {error && (
                  <div className="mb-4 rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-3">
                    <p className="text-sm text-red-100">{error}</p>
                  </div>
                )}
                {isLimitReached && !error && (
                  <div className="mb-4 rounded-xl bg-amber-500/20 border border-amber-400/30 px-4 py-3">
                    <p className="text-sm text-amber-100">Daily limit reached. Try again tomorrow!</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUploadClick}
                    disabled={isButtonDisabled}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#697254] py-4 text-[15px] font-semibold text-[#EFE5D8] shadow-lg transition-all duration-200 disabled:opacity-40"
                  >
                    <Camera className="h-5 w-5" />
                    Take a Photo
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.38, ease }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUploadClick}
                    disabled={isButtonDisabled}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/10 py-4 text-[15px] font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 disabled:opacity-40"
                  >
                    {isScanning ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload Photo
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Scan limit dots */}
              {!loadingScans && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-4 flex items-center justify-center gap-2"
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        i < remainingScans
                          ? "bg-[#A7AD89]"
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
              multiple={false}
            />
          </div>
        ) : (
            <div className="mx-auto max-w-md space-y-6 bg-[#F5EFE6] min-h-screen pb-20">
              <div className="flex items-center justify-between px-5 pt-5">
                <button
                  onClick={resetScan}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#92735C]/10"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M13 16L7 10L13 4" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <Image src="/images/7e0b2a05-a68c-4167-b2ba-c937d73c7000.png" alt="Pickly" width={30} height={30} className="rounded-full" />
                <div className="w-10" />
              </div>

              <div className="text-center space-y-3 px-5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D]">
                  Analysis Complete
                </h1>
                {isScanning ? (
                  <p className="text-gray-600 text-xs sm:text-sm">Analyzing with your personal profile...</p>
                ) : (
                  <p className="text-gray-600 text-xs sm:text-sm">Here's what Pickly found for you</p>
                )}
              </div>

              <Card className="border-0 shadow-2xl bg-white overflow-hidden mx-4 sm:mx-0">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50">
                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt="Analyzed product"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {isScanning ? (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <div className="h-10 sm:h-12 w-10 sm:w-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mb-4"></div>
                        <p className="text-center text-gray-600 text-sm sm:text-base px-4">
                          Analyzing ingredients and nutritional profile...
                        </p>
                      </div>
                    ) : productRating ? (
                      <div className="space-y-4 sm:space-y-6">
                        <div className="text-center space-y-3">
                          {(() => {
                            const colors = getRatingColors(productRating.rating)
                            return (
                              <div
                                className={`inline-flex items-center justify-center w-20 sm:w-24 h-20 sm:h-24 rounded-full border-4 ${colors.border} bg-gradient-to-br ${colors.bg} animate-pulse`}
                              >
                                <div className="text-center">
                                  <span className="text-xl sm:text-2xl font-bold text-gray-800">
                                    {productRating.rating}
                                  </span>
                                  <span className="text-base sm:text-lg text-gray-600">/10</span>
                                </div>
                              </div>
                            )
                          })()}
                          {productRating.productName && (
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 px-4">
                              {productRating.productName}
                            </h2>
                          )}
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          {productRating.reasonsToBuy && (
                            <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 transform hover:scale-[1.02] transition-all duration-300">
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex items-start space-x-3">
                                  <ThumbsUp className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h3 className="font-bold text-emerald-900 text-xs sm:text-sm mb-2 sm:mb-3">
                                      Reasons to Buy
                                    </h3>
                                    <div className="space-y-1.5 sm:space-y-2">
                                      {productRating.reasonsToBuy.map((reason, index) => (
                                        <div
                                          key={index}
                                          className="flex items-start space-x-2 animate-in slide-in-from-left duration-500"
                                          style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                                          <p className="text-emerald-800 text-xs sm:text-sm leading-relaxed">
                                            {reason}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {productRating.reasonsToAvoid && productRating.reasonsToAvoid.length > 0 && (
                            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 transform hover:scale-[1.02] transition-all duration-300">
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex items-start space-x-3">
                                  <ThumbsDown className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h3 className="font-bold text-orange-900 text-xs sm:text-sm mb-2 sm:mb-3">
                                      Consider These Points
                                    </h3>
                                    <div className="space-y-1.5 sm:space-y-2">
                                      {productRating.reasonsToAvoid.map((reason, index) => (
                                        <div
                                          key={index}
                                          className="flex items-start space-x-2 animate-in slide-in-from-left duration-500"
                                          style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                                          <p className="text-orange-800 text-xs sm:text-sm leading-relaxed">{reason}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 transform hover:scale-[1.02] transition-all duration-300">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start space-x-3">
                                <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h3 className="font-bold text-blue-900 text-xs sm:text-sm mb-2">Summary</h3>
                                  <p className="text-blue-800 text-xs sm:text-sm leading-relaxed animate-in fade-in duration-1000">
                                    {productRating.summary || productRating.explanation}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Button
                          onClick={resetScan}
                          className="w-full h-10 sm:h-12 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base"
                        >
                          Scan Another Product
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {productRating && (
                <div
                  className={`transition-all duration-1000 ease-out mx-4 sm:mx-0 ${
                    showChat ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  <Card className="border-0 shadow-2xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 sm:p-5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-bold text-base sm:text-lg">Pickly Assistant</h3>
                          </div>
                        </div>
                      </div>

                      {/* Messages Container */}
                      <div className="h-64 sm:h-72 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-pink-50/30 via-purple-50/30 to-cyan-50/30">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-3 duration-500`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm ${
                                message.isUser
                                  ? "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white rounded-br-md"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                              }`}
                            >
                              <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                              <p
                                className={`text-xs mt-1 sm:mt-2 ${message.isUser ? "text-white/80" : "text-gray-500"}`}
                              >
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}

                        {isTyping && (
                          <div className="flex justify-start animate-in slide-in-from-bottom-3 duration-500">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>

                      <div className="p-3 sm:p-4 bg-gradient-to-r from-pink-50/50 via-purple-50/50 to-cyan-50/50 border-t border-gray-100">
                        <div className="flex items-end space-x-2 sm:space-x-3">
                          <div className="flex-1 relative">
                            <textarea
                              ref={textareaRef}
                              value={inputMessage}
                              onChange={(e) => setInputMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Ask Pickly about ingredients, alternatives, or health benefits..."
                              disabled={isSending}
                              className="w-full resize-none rounded-xl border-2 border-purple-200 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] sm:min-h-[48px] max-h-[100px] sm:max-h-[120px] transition-all duration-200"
                              rows={1}
                            />
                          </div>
                          <Button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isSending}
                            className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 transform ${
                              inputMessage.trim() && !isSending
                                ? "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {isSending ? (
                              <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-4 sm:h-5 w-4 sm:w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
      </div>
    </ProtectedRoute>
  )
}
