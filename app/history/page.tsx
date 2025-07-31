"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Star, Trash2, Eye, Heart, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { motion, AnimatePresence } from "framer-motion"

interface ScanHistoryItem {
  id: string
  imageUrl?: string
  productName?: string
  rating: {
    rating: number
    explanation: string
    recommendations: string[]
  }
  scannedAt: Date
}

interface WishlistItem {
  id: string
  imageUrl?: string
  productName?: string
  rating: {
    rating: number
    explanation: string
  }
  addedAt: Date
}

export default function HistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, getScanHistory, deleteScanFromHistory } = useAuth()
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load real scan history from database
  useEffect(() => {
    const loadScanHistory = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const historyData = await getScanHistory()

        // Transform the data to match the expected format
        const transformedHistory: ScanHistoryItem[] = historyData.map((item) => ({
          id: item.id,
          imageUrl: item.imageUrl,
          productName: item.productName,
          rating: {
            rating: item.rating.rating,
            explanation: item.rating.explanation,
            recommendations: item.rating.recommendations,
          },
          scannedAt: item.scannedAt,
        }))

        setScanHistory(transformedHistory)
        console.log("Loaded scan history:", transformedHistory)
      } catch (error) {
        console.error("Error loading scan history:", error)
        toast({
          title: "Error loading history",
          description: "Failed to load your scan history. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadScanHistory()
  }, [user, getScanHistory, toast])

  // Load wishlist (keeping mock data for now)
  useEffect(() => {
    const mockWishlist: WishlistItem[] = [
      {
        id: "w1",
        imageUrl: "/placeholder.svg?height=100&width=100&text=Almond+Butter",
        productName: "Organic Almond Butter",
        rating: {
          rating: 9,
          explanation: "Pure almond butter with no additives. Excellent source of healthy fats.",
        },
        addedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ]
    setWishlist(mockWishlist)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-500"
    if (rating >= 5) return "bg-yellow-500"
    return "bg-red-500"
  }

  const deleteScan = async (scanId: string) => {
    if (!user) return

    try {
      await deleteScanFromHistory(scanId)
      setScanHistory((prev) => prev.filter((scan) => scan.id !== scanId))
      toast({
        title: "Scan deleted",
        description: "The scan has been removed from your history.",
      })
    } catch (error) {
      console.error("Error deleting scan:", error)
      toast({
        title: "Error",
        description: "Failed to delete the scan. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addToWishlist = (scan: ScanHistoryItem) => {
    const wishlistItem: WishlistItem = {
      id: `w${Date.now()}`,
      imageUrl: scan.imageUrl,
      productName: scan.productName,
      rating: {
        rating: scan.rating.rating,
        explanation: scan.rating.explanation,
      },
      addedAt: new Date(),
    }

    setWishlist((prev) => [...prev, wishlistItem])
    toast({
      title: "Added to wishlist",
      description: `${scan.productName || "Product"} has been added to your wishlist.`,
    })
  }

  const removeFromWishlist = (itemId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== itemId))
    toast({
      title: "Removed from wishlist",
      description: "The item has been removed from your wishlist.",
    })
  }

  const viewScanDetails = (scan: ScanHistoryItem) => {
    setSelectedScan(scan)
  }

  if (selectedScan) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-white">
          <Header />
          <main className="container flex-1 py-4 pb-24 px-4 sm:px-6">
            <motion.div
              className="mx-auto max-w-md space-y-4 sm:space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedScan(null)}
                  className="hover:bg-gray-100 transition-colors text-sm sm:text-base p-2 sm:p-3"
                >
                  ← Back to History
                </Button>
              </div>

              <div className="text-center px-4">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Scan Details
                </h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  Scanned on {formatDate(selectedScan.scannedAt)}
                </p>
              </div>

              <Card className="overflow-hidden shadow-lg border-0 bg-white/80 backdrop-blur-sm mx-2 sm:mx-0">
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={selectedScan.imageUrl || "/placeholder.svg"}
                      alt="Scanned product"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full border-4 sm:border-8 border-primary bg-gradient-to-br from-primary/10 to-primary/20">
                      <span className="text-2xl sm:text-4xl font-bold text-primary">
                        {selectedScan.rating.rating}/10
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Analysis</h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {selectedScan.rating.explanation}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Recommendations</h3>
                      <ul className="space-y-2">
                        {selectedScan.rating.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <span className="text-sm sm:text-base text-gray-600">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="container flex-1 py-4 sm:py-6 pb-24 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <motion.div
              className="text-center mb-6 sm:mb-8 px-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Your Products
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your scanned products and wishlist</p>
            </motion.div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  className="h-8 w-8 sm:h-12 sm:w-12 border-4 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              </div>
            ) : (
              <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 xl:gap-8">
                {/* Scan History Section */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="order-1"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Scan History</h2>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {scanHistory.length} product{scanHistory.length !== 1 ? "s" : ""} scanned
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 border-blue-200 self-start sm:self-center text-xs sm:text-sm px-2 py-1"
                      >
                        {scanHistory.length}
                      </Badge>
                    </div>

                    <div className="space-y-3 max-h-[70vh] sm:max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {scanHistory.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 sm:py-12"
                          >
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No scans yet</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                              Start scanning products to see your history here
                            </p>
                            <Button
                              onClick={() => router.push("/home")}
                              className="bg-primary hover:bg-primary/90 text-sm sm:text-base px-4 py-2"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Scan Your First Product
                            </Button>
                          </motion.div>
                        ) : (
                          scanHistory.map((scan, index) => (
                            <motion.div
                              key={scan.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="group"
                            >
                              <Card className="transition-all duration-200 hover:shadow-md border-gray-200 bg-white">
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-xl shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                                      <img
                                        src={scan.imageUrl || "/placeholder.svg"}
                                        alt="Scanned product"
                                        className="h-full w-full object-cover"
                                      />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                        <Badge
                                          className={`${getRatingColor(scan.rating.rating)} text-white border-0 text-xs px-2 py-1 self-start`}
                                        >
                                          <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                          {scan.rating.rating}/10
                                        </Badge>
                                        {scan.productName && (
                                          <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                            {scan.productName}
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                        {scan.rating.explanation.slice(0, 80)}...
                                      </p>

                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(scan.scannedAt)}
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addToWishlist(scan)}
                                        className="hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                                      >
                                        <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => viewScanDetails(scan)}
                                        className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                                      >
                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => deleteScan(scan.id)}
                                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* Want to Buy Section */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="order-2"
                >
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-lg border border-pink-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Want to Buy</h2>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} in wishlist
                        </p>
                      </div>
                      <Badge className="bg-pink-100 text-pink-700 border-pink-200 self-start sm:self-center text-xs sm:text-sm px-2 py-1">
                        {wishlist.length}
                      </Badge>
                    </div>

                    <div className="space-y-3 max-h-[70vh] sm:max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {wishlist.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 sm:py-12"
                          >
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No items yet</h3>
                            <p className="text-sm sm:text-base text-gray-600 px-4">
                              Add products from your scan history to create your wishlist
                            </p>
                          </motion.div>
                        ) : (
                          wishlist.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 100 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="group"
                            >
                              <Card className="transition-all duration-200 hover:shadow-md border-pink-200 bg-white/80">
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-xl shrink-0 bg-gradient-to-br from-pink-100 to-rose-100">
                                      <img
                                        src={item.imageUrl || "/placeholder.svg"}
                                        alt="Wishlist product"
                                        className="h-full w-full object-cover"
                                      />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                        <Badge
                                          className={`${getRatingColor(item.rating.rating)} text-white border-0 text-xs px-2 py-1 self-start`}
                                        >
                                          <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                          {item.rating.rating}/10
                                        </Badge>
                                        {item.productName && (
                                          <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                            {item.productName}
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                        {item.rating.explanation.slice(0, 80)}...
                                      </p>

                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Heart className="h-3 w-3 text-pink-500" />
                                        Added {formatDate(item.addedAt)}
                                      </div>
                                    </div>

                                    <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeFromWishlist(item.id)}
                                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
