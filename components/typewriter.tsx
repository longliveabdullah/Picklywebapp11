"use client"

import { useState, useEffect } from "react"

interface TypewriterProps {
  texts: string[]
  speed?: number
  delay?: number
  className?: string
}

export function Typewriter({ texts, speed = 100, delay = 2000, className = "" }: TypewriterProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        const fullText = texts[currentTextIndex]

        if (isPaused) {
          setIsPaused(false)
          setIsDeleting(true)
          return
        }

        if (isDeleting) {
          setCurrentText(fullText.substring(0, currentText.length - 1))

          if (currentText === "") {
            setIsDeleting(false)
            setCurrentTextIndex((prev) => (prev + 1) % texts.length)
          }
        } else {
          setCurrentText(fullText.substring(0, currentText.length + 1))

          if (currentText === fullText) {
            setIsPaused(true)
          }
        }
      },
      isDeleting ? speed / 2 : isPaused ? delay : speed,
    )

    return () => clearTimeout(timeout)
  }, [currentText, currentTextIndex, isDeleting, isPaused, texts, speed, delay])

  return (
    <div className={`font-inter font-light tracking-tight leading-tight ${className}`}>
      <span>{currentText}</span>
      <span className="animate-pulse text-white/80">|</span>
    </div>
  )
}
