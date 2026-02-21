"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera,
  Heart,
  Trash2,
  Star,
  Clock,
  ShoppingBag,
  History,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface ScanResult {
  id: string
  productName: string
  rating: number
  explanation: string
  recommendations: string[]
  healthScore: number
  suitabilityScore: number
  scannedAt: Date
  imageUrl?: string
}

interface WishlistItem {
  id: string
  productName: string
  rating: number
  addedAt: Date
  imageUrl?: string
}

export default function ScanPage() {
  const { user } = useAuth()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([
    {
      id: "1",
      productName: "Vitamin C Serum",
      rating: 8,
      explanation: "Excellent antioxidant serum with stable vitamin C formula.",
      recommendations: ["Use in morning routine", "Apply sunscreen after use"],
      healthScore: 85,
      suitabilityScore: 90,
      scannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      imageUrl: "/placeholder.svg?height=60&width=60&text=Serum",
    },
    {
      id: "2",
      productName: "Organic Face Moisturizer",
      rating: 7,
      explanation: "Good hydrating properties with natural ingredients.",
      recommendations: ["Suitable for daily use", "Patch test recommended"],
      healthScore: 78,
      suitabilityScore: 82,
      scannedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      imageUrl: "/placeholder.svg?height=60&width=60&text=Cream",
    },
    {
      id: "3",
      productName: "Protein Powder",
      rating: 6,
      explanation: "Decent protein content but contains artificial additives.",
      recommendations: ["Use post-workout", "Check for allergens"],
      healthScore: 65,
      suitabilityScore: 70,
      scannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      imageUrl: "/placeholder.svg?height=60&width=60&text=Protein",
    },
  ])

  const [wishlist, setWishlist] = useState<WishlistItem[]>([
    {
      id: "w1",
      productName: "Retinol Night Cream",
      rating: 9,
      addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      imageUrl: "/placeholder.svg?height=60&width=60&text=Retinol",
    },
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(
    async (file: File) => {
      console.log("🔍 Starting image upload process...")
      console.log("📁 File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      if (!user) {
        console.error("❌ No user found")
        toast.error("Please log in to scan products")
        setError("Please log in to scan products")
        return
      }

      // Validate file
      if (!file.type.startsWith("image/")) {
        console.error("❌ Invalid file type:", file.type)
        toast.error("Please select a valid image file")
        setError("Please select a valid image file")
        return
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error("❌ File too large:", file.size)
        toast.error("Image file is too large. Please select an image smaller than 10MB.")
        setError("Image file is too large. Please select an image smaller than 10MB.")
        return
      }

      setIsScanning(true)
      setScanResult(null)
      setError(null)

      try {
        console.log("📤 Converting file to base64...")

        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            console.log("✅ Base64 conversion successful, length:", result.length)
            resolve(result.split(",")[1]) // Remove data:image/jpeg;base64, prefix
          }
          reader.onerror = () => {
            console.error("❌ FileReader error")
            reject(new Error("Failed to read file"))
          }
          reader.readAsDataURL(file)
        })

        console.log("📤 Sending scan request to API...")
        console.log("🔑 User ID:", user.id)
        console.log("📊 Base64 length:", base64.length)

        // Call scan API
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: base64,
            userId: user.id,
          }),
        })

        console.log("📥 API Response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("❌ API Error:", errorData)
          throw new Error(errorData.error || `API Error: ${response.status}`)
        }

        const result = await response.json()
        console.log("✅ Scan result received:", result)

        const newScanResult: ScanResult = {
          id: Date.now().toString(),
          productName: result.productName || "Analyzed Product",
          rating: result.rating || 5,
          explanation: result.explanation || "Analysis completed successfully.",
          recommendations: result.recommendations || ["Use as directed"],
          healthScore: result.healthScore || 50,
          suitabilityScore: result.suitabilityScore || 50,
          scannedAt: new Date(),
          imageUrl: URL.createObjectURL(file),
        }

        setScanResult(newScanResult)
        setScanHistory((prev) => [newScanResult, ...prev])
        toast.success("Product scanned successfully!")
        console.log("🎉 Scan completed successfully!")
      } catch (error) {
        console.error("❌ Scan error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to scan product"
        toast.error(errorMessage)
        setError(errorMessage)
      } finally {
        setIsScanning(false)
      }
    },
    [user],
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📁 File input changed")
    const file = event.target.files?.[0]
    if (file) {
      console.log("📁 File selected:", file.name)
      handleImageUpload(file)
    } else {
      console.log("❌ No file selected")
    }
  }

  const handleScanButtonClick = () => {
    console.log("🔘 Scan button clicked")
    console.log("👤 User:", user ? "Logged in" : "Not logged in")
    console.log("🔄 Is scanning:", isScanning)

    if (!user) {
      toast.error("Please log in to scan products")
      setError("Please log in to scan products")
      return
    }

    if (isScanning) {
      console.log("⏳ Already scanning, ignoring click")
      return
    }

    console.log("📁 Triggering file input click")
    fileInputRef.current?.click()
  }

  const addToWishlist = (item: ScanResult) => {
    const wishlistItem: WishlistItem = {
      id: `w${Date.now()}`,
      productName: item.productName,
      rating: item.rating,
      addedAt: new Date(),
      imageUrl: item.imageUrl,
    }
    setWishlist((prev) => [wishlistItem, ...prev])
    toast.success("Added to wishlist!")
  }

  const removeFromHistory = (id: string) => {
    setScanHistory((prev) => prev.filter((item) => item.id !== id))
    toast.success("Removed from history")
  }

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id))
    toast.success("Removed from wishlist")
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-600"
    if (rating >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getRatingBg = (rating: number) => {
    if (rating >= 8) return "bg-green-100"
    if (rating >= 6) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getRatingIcon = (rating: number) => {
    if (rating >= 8) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (rating >= 6) return <AlertCircle className="w-4 h-4 text-yellow-600" />
    return <XCircle className="w-4 h-4 text-red-600" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Product Scanner
              </h1>
              <p className="text-gray-600 text-sm">Get personalized insights about any product</p>
            </div>
            <Button
              onClick={handleScanButtonClick}
              disabled={isScanning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Scan Product
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Upload Instructions */}
        {!scanResult && !isScanning && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Scan</h3>
                <p className="text-gray-600 mb-4">
                  Click the "Scan Product" button above to upload an image and get personalized insights
                </p>
                <Button
                  onClick={handleScanButtonClick}
                  disabled={isScanning}
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Enhanced Scan Result */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="mb-8"
            >
              <Card className="bg-white border-0 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1">
                  <div className="bg-white rounded-lg">
                    <CardContent className="p-0">
                      {/* Header Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-100">
                        <div className="flex items-start gap-6">
                          {scanResult.imageUrl && (
                            <div className="relative">
                              <img
                                src={scanResult.imageUrl || "/placeholder.svg"}
                                alt={scanResult.productName}
                                className="w-24 h-24 rounded-xl object-cover shadow-lg ring-4 ring-white"
                              />
                              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                                {getRatingIcon(scanResult.rating)}
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                                  {scanResult.productName}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={`${getRatingBg(scanResult.rating)} ${getRatingColor(scanResult.rating)} border-0 text-sm font-semibold px-3 py-1`}
                                  >
                                    <Star className="w-4 h-4 mr-1 fill-current" />
                                    {scanResult.rating}/10
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Scanned {formatTimeAgo(scanResult.scannedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Score Cards */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              <div className={`rounded-lg border p-3 ${getScoreColor(scanResult.healthScore)}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Shield className="w-4 h-4" />
                                  <span className="text-xs font-medium uppercase tracking-wide">Health Score</span>
                                </div>
                                <div className="text-2xl font-bold">{scanResult.healthScore}/100</div>
                              </div>
                              <div className={`rounded-lg border p-3 ${getScoreColor(scanResult.suitabilityScore)}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-xs font-medium uppercase tracking-wide">Suitability</span>
                                </div>
                                <div className="text-2xl font-bold">{scanResult.suitabilityScore}/100</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 space-y-6">
                        {/* Analysis */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            Analysis
                          </h4>
                          <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-blue-600">
                            {scanResult.explanation}
                          </p>
                        </div>

                        {/* Recommendations */}
                        {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              Recommendations
                            </h4>
                            <div className="space-y-2">
                              {scanResult.recommendations.map((rec, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                                >
                                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700 text-sm leading-relaxed">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => addToWishlist(scanResult)}
                            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Add to Wishlist
                          </Button>
                          <Button
                            onClick={handleScanButtonClick}
                            variant="outline"
                            className="flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 bg-transparent"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Scan Another Product
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scan History Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-lg h-fit">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <History className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Scan History</h2>
                      <p className="text-sm text-gray-600">Recently analyzed products</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {scanHistory.length} items
                  </Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {scanHistory.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Camera className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-500">No scans yet</p>
                        <p className="text-sm text-gray-400">Start scanning products to see your history</p>
                      </motion.div>
                    ) : (
                      scanHistory.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl || "/placeholder.svg"}
                                alt={item.productName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.productName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  className={`${getRatingBg(item.rating)} ${getRatingColor(item.rating)} border-0 text-xs`}
                                >
                                  {item.rating}/10
                                </Badge>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(item.scannedAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => addToWishlist(item)}
                                variant="ghost"
                                size="sm"
                                className="text-pink-600 hover:bg-pink-50 p-2"
                              >
                                <Heart className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => removeFromHistory(item.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Want to Buy Section */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-pink-50 to-purple-100/50 border-pink-200 shadow-lg h-fit">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-600 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Want to Buy</h2>
                      <p className="text-sm text-gray-600">Your wishlist items</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                    {wishlist.length} items
                  </Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {wishlist.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Heart className="w-8 w-8 text-pink-600" />
                        </div>
                        <p className="text-gray-500">No wishlist items</p>
                        <p className="text-sm text-gray-400">Add products you want to buy</p>
                      </motion.div>
                    ) : (
                      wishlist.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 100 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl || "/placeholder.svg"}
                                alt={item.productName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.productName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  className={`${getRatingBg(item.rating)} ${getRatingColor(item.rating)} border-0 text-xs`}
                                >
                                  {item.rating}/10
                                </Badge>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Added {formatTimeAgo(item.addedAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => removeFromWishlist(item.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        multiple={false}
      />
    </div>
  )
}
