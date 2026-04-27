import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CookieConsent } from '@/components/cookie-consent'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Quotiq — Enterprise CPQ & Invoicing Platform',
  description: 'Advanced CPQ and invoicing solution for modern businesses. Streamline your sales process with professional quotes, automated invoicing, and intelligent pricing.',
  keywords: ['CPQ software', 'enterprise invoicing', 'quote management', 'sales automation', 'billing platform', 'Quotiq'],
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <CookieConsent />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
