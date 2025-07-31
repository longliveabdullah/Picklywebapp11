import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { BottomNavigation } from "@/components/bottom-navigation"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Pickly - Personalized Product Ratings",
  description: "Get personalized AI-powered ratings for products based on your profile",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter">
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            {children}
            <BottomNavigation />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
