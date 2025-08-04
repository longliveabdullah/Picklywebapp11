"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, Upload, X, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ScanLimitService } from "@/lib/scan-limit-service"
import type { ProductRating } from "@/types"

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
        setRemainingScans(3) // Default to full limit on error
      } finally {
        setLoadingScans(false)
      }
    }

    loadRemainingScans()
  }, [user])

  const handleFileUpload = useCallback(
    async (file: File) => {
      console.log("📁 Starting file upload process...")
      console.log("📄 File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      })

      if (!user) {
        console.error("❌ No user found")
        toast({
          title: "Authentication Error",
          description: "Please sign in to analyze products.",
          variant: "destructive",
        })
        setError("Please sign in to analyze products.")
        return
      }

      // Check scan limits before proceeding
      try {
        const canScan = await ScanLimitService.canUserScan(user.id, user.email)
        if (!canScan) {
          toast({
            title: "Daily Limit Reached",
            description: "You've reached your daily limit of 3 scans. Try again tomorrow!",
            variant: "destructive",
          })
          setError("You've reached your daily limit of 3 scans. Try again tomorrow!")
          return
        }
      } catch (limitError) {
        console.error("Error checking scan limits:", limitError)
        // Continue with scan if limit check fails
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        console.error("❌ Invalid file type:", file.type)
        toast({
          title: "Invalid File",
          description: "Please select a valid image file (JPG, PNG, etc.).",
          variant: "destructive",
        })
        setError("Please select a valid image file.")
        return
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error("❌ File too large:", file.size)
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        })
        setError("Image file is too large. Please select an image smaller than 10MB.")
        return
      }

      setIsScanning(true)
      setProductRating(null)
      setError(null)

      try {
        // Create image URL for preview
        const imageUrl = URL.createObjectURL(file)
        setSelectedImage(imageUrl)

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

        console.log("📤 Sending analysis request...")
        console.log("🔑 User ID:", user.id)
        console.log("📊 Base64 length:", base64.length)

        // Call the scan API with better error handling
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
          headers: Object.fromEntries(response.headers.entries()),
        })

        // Handle response with better error checking
        let result
        try {
          const responseText = await response.text()
          console.log("📝 Raw response:", responseText.substring(0, 200) + "...")

          // Try to parse as JSON
          result = JSON.parse(responseText)
        } catch (parseError) {
          console.error("❌ Failed to parse response as JSON:", parseError)
          throw new Error("Server returned invalid response. Please try again.")
        }

        if (!response.ok) {
          console.error("❌ API Error:", result)
          throw new Error(result.error || result.details || `Server error: ${response.status}`)
        }

        console.log("✅ Analysis result:", result)

        // Validate the result structure
        if (!result || typeof result.rating !== "number") {
          console.error("❌ Invalid result structure:", result)
          throw new Error("Invalid response from analysis service")
        }

        const rating: ProductRating = {
          rating: result.rating || 5,
          summary: result.summary || "Analysis completed successfully.",
          brandName: result.brandName,
          category: result.category,
          pros: result.pros,
          cons: result.cons,
        }

        setProductRating(rating)

        // Increment scan count after successful analysis
        try {
          await ScanLimitService.incrementScanCount(user.id)
          const newRemaining = await ScanLimitService.getRemainingScans(user.id, user.email)
          setRemainingScans(newRemaining)
        } catch (limitError) {
          console.error("Error updating scan count:", limitError)
          // Don't fail the whole process if scan count update fails
        }

        // Save to scan history
        try {
          await addScanToHistory({
            imageUrl: imageUrl,
            productName: rating.productName,
            rating,
            userProfile: user.profile,
          })
          console.log("💾 Saved to scan history")
        } catch (historyError) {
          console.error("⚠️ Failed to save to history:", historyError)
          // Don't fail the whole process if history save fails
        }

        toast({
          title: "Analysis Complete",
          description: "Product has been analyzed successfully!",
        })

        console.log("🎉 Analysis completed successfully!")
      } catch (error) {
        console.error("❌ Analysis error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to analyze the product. Please try again."
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive",
        })
        setError(errorMessage)

        // Reset the image if analysis failed
        setSelectedImage(null)
      } finally {
        setIsScanning(false)
      }
    },
    [user, addScanToHistory, toast],
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📁 File input changed")
    const file = event.target.files?.[0]
    if (file) {
      console.log("📁 File selected:", file.name)
      handleFileUpload(file)
    } else {
      console.log("❌ No file selected")
    }
    // Reset the input value so the same file can be selected again
    event.target.value = ""
  }

  const handleUploadFromGallery = () => {
    console.log("🖼️ Upload from Gallery button clicked")
    console.log("👤 User:", user ? "Logged in" : "Not logged in")
    console.log("🔄 Is scanning:", isScanning)

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to analyze products.",
        variant: "destructive",
      })
      setError("Please sign in to analyze products.")
      return
    }

    if (isScanning) {
      console.log("⏳ Already scanning, ignoring click")
      return
    }

    if (remainingScans <= 0) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached your daily limit of 3 scans. Try again tomorrow!",
        variant: "destructive",
      })
      setError("You've reached your daily limit of 3 scans. Try again tomorrow!")
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture")
      console.log("📁 Triggering file input click")
      fileInputRef.current.click()
    }
  }

  const handleCameraCapture = () => {
    console.log("📷 Camera capture button clicked")

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
      setError("You've reached your daily limit of 3 scans. Try again tomorrow!")
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment")
      fileInputRef.current.click()
    }
  }

  const resetScan = () => {
    console.log("🔄 Resetting scan")
    setSelectedImage(null)
    setProductRating(null)
    setError(null)
  }

  const goBack = () => {
    console.log("⬅️ Going back to home")
    router.push("/home")
  }

  const isLimitReached = remainingScans <= 0
  const isButtonDisabled = isScanning || isLimitReached

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-4 pb-24">
          {!selectedImage ? (
            <div className="mx-auto max-w-md space-y-6">
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={goBack} className="hover:bg-gray-100">
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold">Scan Product</h1>
                <p className="mt-2 text-muted-foreground">Choose how you'd like to scan your product</p>
              </div>

              {/* Scan Limit Display */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div className="text-center">
                      {loadingScans ? (
                        <p className="text-blue-700 font-medium">Loading scan limits...</p>
                      ) : (
                        <>
                          <p className="text-blue-700 font-medium">
                            Daily Scans Remaining: <span className="text-xl font-bold">{remainingScans}/3</span>
                          </p>
                          {remainingScans === 0 && (
                            <p className="text-sm text-blue-600 mt-1">Resets tomorrow at midnight</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Limit Reached Alert */}
              {isLimitReached && !error && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700">
                    You've reached your daily limit of 3 scans. Your scan count will reset tomorrow at midnight.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {/* Take Photo Button */}
                    <Button
                      onClick={handleCameraCapture}
                      className="h-16 text-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50"
                      size="lg"
                      disabled={isButtonDisabled}
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Take Photo
                      {isLimitReached && <span className="ml-2 text-xs">(Limit Reached)</span>}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">OR</span>
                      </div>
                    </div>

                    {/* Upload from Gallery Button */}
                    <Button
                      onClick={handleUploadFromGallery}
                      variant="outline"
                      className="h-16 w-full text-lg bg-transparent hover:bg-gray-50 disabled:opacity-50"
                      size="lg"
                      disabled={isButtonDisabled}
                    >
                      {isScanning ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" />
                          Upload from Gallery
                          {isLimitReached && <span className="ml-2 text-xs">(Limit Reached)</span>}
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
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={resetScan} className="hover:bg-gray-100">
                  ← Back
                </Button>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold">Product Analysis</h1>
                {isScanning ? (
                  <p className="mt-2 text-muted-foreground">Analyzing product with your profile...</p>
                ) : (
                  <p className="mt-2 text-muted-foreground">Here's your personalized rating</p>
                )}
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt="Selected product"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {isScanning ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <p className="mt-4 text-center text-muted-foreground">
                        Analyzing product and matching with your profile...
                      </p>
                    </div>
                  ) : productRating ? (
                    productRating.rating === -1 ? (
                      <div className="text-center py-8">
                        <h3 className="text-2xl font-bold mb-2">😕 Sorry, we couldn't analyze this product.</h3>
                        <p className="text-gray-600">From where did u find this thing ?</p>
                      </div>
                    ) : (
                    <div className="space-y-4">
                      {productRating.rating === 0 && (
                        <Alert variant="destructive" className="bg-red-500 text-white border-red-700">
                          <AlertCircle className="h-5 w-5 text-white" />
                          <AlertDescription className="font-bold">
                            ⚠️ This product is dangerous for you due to your health profile.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex items-center justify-center">
                        <div className={`relative flex h-32 w-32 items-center justify-center rounded-full border-8 ${getRatingColor(productRating.rating)}`}>
                          <span className="text-4xl font-bold">{productRating.rating}/10</span>
                        </div>
                      </div>

                      {productRating.brandName && (
                        <div className="text-center">
                          <h3 className="text-2xl font-bold">{productRating.brandName}</h3>
                          {productRating.category && <p className="text-md text-gray-500">Category: {productRating.category}</p>}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">✅ Pros</h3>
                          <ul className="list-inside list-disc space-y-1">
                            {productRating.pros?.map((pro, index) => (
                              <li key={index}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">❌ Cons</h3>
                          <ul className="list-inside list-disc space-y-1">
                            {productRating.cons?.map((con, index) => (
                              <li key={index}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">Summary</h3>
                        <p>{productRating.summary}</p>
                      </div>

                      <Button onClick={resetScan} className="w-full">
                        Scan Another Product
                      </Button>
                    </div>
                    )
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

function getRatingColor(rating: number) {
  if (rating >= 8) return "border-green-500"
  if (rating >= 5) return "border-yellow-500"
  return "border-red-500"
}
