import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { I18nProvider } from "@/components/i18n-provider"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  applicationName: "Pickly",
  title: {
    default: "Pickly — personalized product picks",
    template: "%s · Pickly",
  },
  description:
    "Scan products, get AI suitability scores tailored to your profile, compare prices across retailers, and build your shelf and routines.",
  icons: {
    icon: "/images/pickly-mark.png",
    shortcut: "/images/pickly-mark.png",
    apple: "/images/pickly-mark.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <I18nProvider>
              {children}
              <BottomNavigation />
              <Toaster />
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
