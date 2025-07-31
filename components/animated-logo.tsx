"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

export function AnimatedLogo({ size = "lg" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const [isLoaded, setIsLoaded] = useState(false)

  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Link href="/" className="flex items-center justify-center">
      <div
        className={`
          relative transition-all duration-700 ease-out
          ${isLoaded ? "animate-logoFloat opacity-100 scale-100" : "opacity-0 scale-75"}
        `}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pickly-pink via-pickly-purple to-pickly-blue opacity-20 blur-xl animate-pulse"></div>
        <div className="relative">
          <Image
            src="/images/logo.png"
            alt="Pickly Logo"
            width={sizes[size]}
            height={sizes[size]}
            className="object-contain drop-shadow-lg"
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      </div>
    </Link>
  )
}
