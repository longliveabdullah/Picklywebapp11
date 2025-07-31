"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Primary gradient blob */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: "linear-gradient(135deg, #e94baf 0%, #8c52ff 50%, #5b7df3 100%)",
        }}
        animate={{
          x: ["-20%", "120%", "-20%"],
          y: ["-10%", "110%", "-10%"],
          scale: [1, 1.2, 0.8, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        initial={{ x: "-20%", y: "-10%" }}
      />

      {/* Secondary gradient blob */}
      <motion.div
        className="absolute w-80 h-80 rounded-full opacity-25 blur-3xl"
        style={{
          background: "linear-gradient(225deg, #22d3d3 0%, #a2e896 50%, #e94baf 100%)",
        }}
        animate={{
          x: ["120%", "-20%", "120%"],
          y: ["110%", "-10%", "110%"],
          scale: [0.8, 1.3, 1, 0.8],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        initial={{ x: "120%", y: "110%" }}
      />

      {/* Tertiary gradient blob */}
      <motion.div
        className="absolute w-72 h-72 rounded-full opacity-20 blur-2xl"
        style={{
          background: "linear-gradient(45deg, #5b7df3 0%, #22d3d3 50%, #8c52ff 100%)",
        }}
        animate={{
          x: ["50%", "10%", "90%", "50%"],
          y: ["50%", "20%", "80%", "50%"],
          scale: [1, 0.7, 1.4, 1],
          rotate: [0, 90, 270, 360],
        }}
        transition={{
          duration: 18,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        initial={{ x: "50%", y: "50%" }}
      />

      {/* Floating particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/20"
          animate={{
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
            ],
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
            ],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}

      {/* Mesh gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, #e94baf 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, #8c52ff 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, #5b7df3 0%, transparent 50%),
            radial-gradient(circle at 60% 60%, #22d3d3 0%, transparent 50%),
            radial-gradient(circle at 90% 90%, #a2e896 0%, transparent 50%)
          `,
        }}
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}
