import type { Metadata } from 'next'
import Script from 'next/script'
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
  // ── Títulos ──────────────────────────────────────────────────────────────
  title: {
    default: 'Contigo Constructions | Carpentry & Renovations Adelaide',
    template: '%s | Contigo Constructions',
  },

  // ── Descripción ──────────────────────────────────────────────────────────
  description:
    'Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Request a free quote today.',

  // ── Keywords ─────────────────────────────────────────────────────────────
  keywords: [
    'carpentry Adelaide',
    'carpentry services Adelaide',
    'home renovations Adelaide',
    'home extensions Adelaide',
    'cladding Adelaide',
    'gyprock Adelaide',
    'licensed builder Adelaide',
    'licensed carpentry contractor Adelaide',
    'BLD licence 357596',
    'Contigo Constructions',
  ],

  // ── Icons ────────────────────────────────────────────────────────────────
  icons: {
    icon: '/icon.svg',
  },

  // ── Open Graph ───────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://contigoconstructions.com.au',
    siteName: 'Contigo Constructions',
    title: 'Contigo Constructions | Carpentry & Renovations Adelaide',
    description:
      'Licensed Carpentry & Joinery contractor in Adelaide. BLD Licence 357596. Master Builders member. Specialising in renovations, extensions, carpentry, cladding and gyprock.',
    images: [
      {
        url: 'https://contigoconstructions.com.au/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contigo Constructions — Carpentry & Renovations Adelaide',
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Contigo Constructions | Carpentry & Renovations Adelaide',
    description:
      'Licensed Carpentry & Joinery contractor in Adelaide. BLD Licence 357596. Master Builders member.',
    images: ['https://contigoconstructions.com.au/og-image.jpg'],
  },

  // ── Robots ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Canonical ────────────────────────────────────────────────────────────
  alternates: {
    canonical: 'https://contigoconstructions.com.au',
  },

  // ── Verificación ─────────────────────────────────────────────────────────
  // Agregar si se tiene el código de Google Search Console
  // verification: {
  //   google: 'GOOGLE_VERIFICATION_CODE',
  // },

  // ── Metadatos de aplicación ──────────────────────────────────────────────
  applicationName: 'Contigo Constructions',
  authors: [{ name: 'Contigo Constructions', url: 'https://contigoconstructions.com.au' }],
  creator: 'Contigo Constructions Pty Ltd',
  publisher: 'Contigo Constructions Pty Ltd',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en-AU"
      className={`${alegreya.variable} ${alegreyaSans.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LY3HM4WSBD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LY3HM4WSBD');
          `}
        </Script>
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  )
}
