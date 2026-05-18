"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

const HERO_GRADIENT = "linear-gradient(to bottom right, #697254, #8C916C)"
const FOOTER_GRADIENT = "linear-gradient(to bottom, #697254 0%, #8C916C 50%, #697254 100%)"
const WAVE_ACCENT = "#697254"

const easeSmooth = [0.22, 1, 0.36, 1] as const

const revealViewport = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.55, ease: easeSmooth },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#EFE5D8]">
      {/* Hero: profile-style gradient, white text, wave at bottom */}
      <section id="home" className="relative min-h-[90vh] sm:min-h-[85vh] md:min-h-[80vh] flex flex-col" style={{ background: HERO_GRADIENT }}>
        {/* Nav */}
        <nav className="flex items-center justify-between px-4 py-4 sm:py-5 md:px-8">
          <Logo size="sm" />
          <div className="flex items-center gap-3 sm:gap-4 md:gap-8 text-[#EFE5D8] text-xs sm:text-sm font-medium tracking-wide">
            <a href="#home" className="hover:opacity-90 transition-opacity duration-200">
              HOME
            </a>
            <a href="#features" className="hover:opacity-90 transition-opacity duration-200">
              FEATURES
            </a>
            <a href="#about" className="hover:opacity-90 transition-opacity duration-200">
              ABOUT
            </a>
            <Link href="/auth" className="hover:opacity-90 transition-opacity duration-200">
              Try
            </Link>
          </div>
        </nav>

        {/* Hero content - mobile: stacked, generous spacing; desktop: side by side */}
        <div className="flex-1 flex flex-col-reverse md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 px-5 sm:px-6 md:px-12 max-w-6xl mx-auto w-full py-6 sm:py-8 md:py-0">
          <div className="flex-1 text-[#EFE5D8] text-center md:text-left w-full max-w-lg mx-auto md:mx-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 tracking-tight leading-tight sm:leading-tight">
              Personalized product ratings
            </h1>
            <p className="text-[#EFE5D8]/95 text-sm sm:text-base md:text-lg max-w-xl mx-auto md:mx-0 mb-6 sm:mb-8 font-medium leading-relaxed">
              Don’t just pick — Pickly.
            </p>
            <Link href="/splash" className="inline-block">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#EFE5D8] text-[#697254] hover:bg-[#EFE5D8]/90 font-semibold rounded-xl px-8 h-12 text-base shadow-lg transition-all duration-200"
              >
                Get started
              </Button>
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center md:justify-center pointer-events-none w-full max-w-[200px] sm:max-w-[240px] md:max-w-none ml-8 md:ml-0">
            <Image
              src="/images/undraw_happy-customer_white (1).svg"
              alt="Happy Pickly customer"
              width={320}
              height={280}
              className="w-full max-w-[200px] sm:max-w-[260px] md:w-80 h-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* White wave at bottom of hero */}
        <div className="wave-hero" aria-hidden />
      </section>

      {/* White section with wave divider (purple wave) - "Find us on social" style */}
      <section id="features" className="bg-[#EFE5D8] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-[#697254] mb-4"
            {...revealViewport}
          >
            Why Pickly?
          </motion.h2>
          <motion.p
            className="text-[#92735C] max-w-2xl mx-auto mb-12"
            initial={revealViewport.initial}
            whileInView={revealViewport.whileInView}
            viewport={revealViewport.viewport}
            transition={{ ...revealViewport.transition, delay: 0.08 }}
          >
            Scan products, get personalized scores, and make better choices for your health and lifestyle.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "🔍", title: "Scan & analyze", desc: "Use your camera to scan products and get instant AI analysis." },
              { icon: "⭐", title: "Personalized ratings", desc: "Scores tailored to your profile, goals, and preferences." },
              { icon: "📋", title: "History & compare", desc: "Keep a history and compare products side by side." },
              { icon: "🛒", title: "Personal shelf", desc: "Add products to your shelf, track expiration dates, and get notified if you already have a product or something similar before you buy." },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="p-6 rounded-2xl bg-[#E5DACF] border-2 border-transparent transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#697254] hover:shadow-[0_12px_28px_-8px_rgba(105,114,84,0.25)]"
                initial={revealViewport.initial}
                whileInView={revealViewport.whileInView}
                viewport={revealViewport.viewport}
                transition={{ ...revealViewport.transition, delay: 0.1 + i * 0.08 }}
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-[#697254] mb-2">{card.title}</h3>
                <p className="text-[#92735C] text-sm">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave container: white bg, purple wave at bottom */}
      <div id="about" className="wave-container">
        <div className="h-full flex flex-col items-center justify-center px-4">
          <h2 className="text-xl md:text-2xl font-bold text-[#697254] mb-4">Find us on social media</h2>
          <div className="flex gap-6">
            <a
              href="https://www.linkedin.com/company/pickly-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#92735C] hover:text-[#697254] transition-colors"
              aria-label="Pickly AI on LinkedIn"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@picklyai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#92735C] hover:text-[#697254] transition-colors"
              aria-label="Pickly AI on TikTok"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Footer: purple background */}
      <footer className="text-[#EFE5D8] py-12 md:py-16" style={{ background: FOOTER_GRADIENT }}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Logo size="sm" />
            <p className="mt-4 text-[#EFE5D8]/90 text-sm max-w-xs">
              Pickly helps you make informed choices with personalized AI-powered product ratings.
            </p>
          </div>
          <div>
            <h3 className="font-semibold uppercase text-sm tracking-wider mb-4">Contact us</h3>
            <ul className="space-y-2 text-sm text-[#EFE5D8]/90">
              <li>Support: support@pickly.com</li>
              <li>Feedback: feedback@pickly.com</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold uppercase text-sm tracking-wider mb-3">Mobile app</h3>
            <p className="text-sm text-[#EFE5D8]/90 mb-4">Pickly mobile app coming soon.</p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#"
                aria-label="Get Pickly on Google Play"
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black hover:bg-black/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#EFE5D8]/50 focus:ring-offset-2 focus:ring-offset-[#697254]"
              >
                <svg className="h-5 w-5 text-[#EFE5D8] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L12.001 12l5.697-3.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z" />
                </svg>
                <div className="text-left">
                  <span className="block text-[10px] text-[#EFE5D8]/90 leading-tight">GET IT ON</span>
                  <span className="block text-sm font-medium text-[#EFE5D8] leading-tight">Google Play</span>
                </div>
              </a>
              <a
                href="#"
                aria-label="Download Pickly on the App Store"
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black hover:bg-black/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#EFE5D8]/50 focus:ring-offset-2 focus:ring-offset-[#697254]"
              >
                <svg className="h-6 w-6 text-[#EFE5D8] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <span className="block text-[10px] text-[#EFE5D8]/90 leading-tight">Download on the</span>
                  <span className="block text-sm font-medium text-[#EFE5D8] leading-tight">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-10 pt-8 border-t border-[#EFE5D8]/20 text-center text-sm text-[#EFE5D8]/80">
          © {new Date().getFullYear()} Pickly. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
