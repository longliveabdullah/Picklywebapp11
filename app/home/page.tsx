"use client"

import { useEffect } from "react"
import { Header } from "@/components/header"
import { Typewriter } from "@/components/typewriter"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { user } = useAuth()

  useEffect(() => {
    const handleOpenCamera = () => {
      // Camera functionality can be triggered from the bottom navigation
      console.log("Camera opened from navigation")
    }

    window.addEventListener("openCamera", handleOpenCamera)
    return () => window.removeEventListener("openCamera", handleOpenCamera)
  }, [])

  // Also check for camera parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("camera") === "true") {
      // Handle camera intent from navigation
      console.log("Camera intent from navigation")
      // Clean up URL
      window.history.replaceState({}, "", "/home")
    }
  }, [])

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="h-full w-full object-cover">
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Recording%202025-05-04%20230627-m5p9fu1O1ZkqNN5WEwcvGf1Dlxa0Ze.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="container flex-1 flex items-center justify-center pb-24">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <Typewriter
                  texts={["Hi there", "ready to make new picks?"]}
                  speed={80}
                  delay={2500}
                  className="text-4xl md:text-5xl lg:text-6xl font-light text-white drop-shadow-lg"
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
