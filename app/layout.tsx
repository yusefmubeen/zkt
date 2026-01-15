import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zakat-beregner | Beregn din zakat nemt og præcist",
  description:
    "Gratis islamisk zakat-beregner. Beregn din zakat på guld, sølv, kontanter, aktier og investeringer. Understøtter både sølv- og guld-nisab samt Amana-metoden.",
  generator: "v0.app",
  keywords: [
    "zakat",
    "zakat beregner",
    "islamisk velgørenhed",
    "nisab",
    "zakat calculator",
    "muslim",
    "islam",
    "donation",
  ],
  authors: [{ name: "Abu Hiba" }],
  creator: "Abu Hiba",
  metadataBase: new URL("https://zkt.dk"),
  alternates: {
    canonical: "https://zkt.dk",
  },
  openGraph: {
    type: "website",
    locale: "da_DK",
    url: "https://zkt.dk",
    title: "Zakat-beregner | Beregn din zakat nemt og præcist",
    description: "Gratis islamisk zakat-beregner. Beregn din zakat på guld, sølv, kontanter, aktier og investeringer.",
    siteName: "Zakat-beregner",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zakat-beregner - Islamisk velgørenhedsberegner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zakat-beregner | Beregn din zakat nemt og præcist",
    description: "Gratis islamisk zakat-beregner. Beregn din zakat på guld, sølv, kontanter, aktier og investeringer.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: "#84cc16",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="da">
      <head></head>
      <body className={`${geist.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
