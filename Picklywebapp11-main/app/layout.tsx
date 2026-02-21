import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { BottomNavigation } from "@/components/bottom-navigation"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Pickly - Personalized Product Ratings",
  description: "Get personalized AI-powered ratings for products based on your profile",
  generator: "v0.dev",
  icons: {
    icon: "/images/pickly.png",
    shortcut: "/images/pickly.png",
    apple: "/images/pickly.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-dm-sans">
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
