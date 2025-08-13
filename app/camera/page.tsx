"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, Upload, X, AlertCircle, Clock, Send, ThumbsUp, ThumbsDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ScanLimitService } from "@/lib/scan-limit-service"
import type { ProductRating } from "@/types"

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

    setMessages((prev) => [...prev, userMessage])
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
          message: userMessage.content,
          productRating: productRating,
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
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/30">
        <main className="container flex-1 py-4 pb-20 px-4 sm:px-6">
          {!selectedImage ? (
            <div className="mx-auto max-w-md space-y-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={goBack}
                  className="text-gray-600 hover:text-gray-800 hover:bg-white/80 transition-all duration-200"
                >
                  <X className="h-5 w-5 mr-2" />
                  Close
                </Button>
              </div>

              <div className="text-center space-y-4">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
                  Scan with Pickly
                </h1>
                <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto leading-relaxed px-4">
                  Point at any product label. Get instant insights on what to buy and what to avoid.
                </p>
              </div>

              <Card className="border-0 shadow-lg bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50 mx-4 sm:mx-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-center">
                      {loadingScans ? (
                        <p className="text-gray-700 font-medium text-sm sm:text-base">Loading scan limits...</p>
                      ) : (
                        <>
                          <p className="text-gray-800 font-bold text-base sm:text-lg">
                            Daily Scans:{" "}
                            <span className="text-lg sm:text-xl bg-gradient-to-r from-pink-600 to-cyan-600 bg-clip-text text-transparent">
                              {remainingScans}/3
                            </span>
                          </p>
                          {remainingScans === 0 && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">Resets tomorrow at midnight</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 shadow-sm mx-4 sm:mx-0">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {isLimitReached && !error && (
                <Alert className="bg-amber-50 border-amber-200 shadow-sm mx-4 sm:mx-0">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    You've reached your daily limit of 3 scans. Your scan count will reset tomorrow at midnight.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="border-0 shadow-xl bg-white mx-4 sm:mx-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-5">
                    <Button
                      onClick={handleUploadClick}
                      className={`h-12 sm:h-14 w-full text-sm sm:text-base font-bold transition-all duration-300 transform ${
                        isButtonDisabled
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] animate-pulse"
                      }`}
                      size="lg"
                      disabled={isButtonDisabled}
                    >
                      <Camera className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5" />
                      Take Photo
                      {isLimitReached && <span className="ml-2 text-xs sm:text-sm opacity-75">(Limit Reached)</span>}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-gray-500 font-medium tracking-wider">OR</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleUploadClick}
                      variant="outline"
                      className={`h-12 sm:h-14 w-full text-sm sm:text-base font-medium transition-all duration-300 transform ${
                        isButtonDisabled
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-2 border-purple-300 text-purple-700 hover:border-purple-400 hover:text-purple-800 hover:bg-gradient-to-r hover:from-pink-50 hover:to-cyan-50 hover:scale-[1.02] shadow-sm hover:shadow-md"
                      }`}
                      size="lg"
                      disabled={isButtonDisabled}
                    >
                      {isScanning ? (
                        <>
                          <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2 sm:mr-3" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5" />
                          Upload from Gallery
                          {isLimitReached && (
                            <span className="ml-2 text-xs sm:text-sm opacity-75">(Limit Reached)</span>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                multiple={false}
              />
            </div>
          ) : (
            <div className="mx-auto max-w-md space-y-6">
              <div className="flex items-center justify-between px-4 sm:px-0">
                <Button
                  variant="ghost"
                  onClick={resetScan}
                  className="text-gray-600 hover:text-gray-800 hover:bg-white/80 transition-all duration-200"
                >
                  ← Back
                </Button>
              </div>

              <div className="text-center space-y-3 px-4 sm:px-0">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
                  Pickly Analysis Complete
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
        </main>
      </div>
    </ProtectedRoute>
  )
}
