import type { Metadata } from 'next'
import { Alegreya, Alegreya_Sans, Space_Grotesk } from 'next/font/google'
import { LenisProvider } from '@/presentation/providers/LenisProvider'
import './globals.css'

// Alegreya superfamily per the corporate manual (April 2026):
// Alegreya (serif) for display, Alegreya Sans for UI/body.
const alegreya = Alegreya({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-alegreya',
  display: 'swap',
})

// Alegreya Sans has no 600 weight — font-semibold resolves to 700.
const alegreyaSans = Alegreya_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-alegreya-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Contigo Constructions | Luxury Home Builders Adelaide',
  description: 'Premium construction, extensions, and renovations in Adelaide. Award-winning builders specializing in luxury homes.',
  openGraph: {
    title: 'Contigo Constructions',
    description: 'Premium construction services Adelaide',
    url: 'https://contigo-constructions.com.au',
    siteName: 'Contigo Constructions',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${alegreya.variable} ${alegreyaSans.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body>
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  )
}
