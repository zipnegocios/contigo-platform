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
    'BLD licence 360639',
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
      'Licensed Carpentry & Joinery contractor in Adelaide. BLD Licence 360639. Master Builders member. Specialising in renovations, extensions, carpentry, cladding and gyprock.',
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
      'Licensed Carpentry & Joinery contractor in Adelaide. BLD Licence 360639. Master Builders member.',
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
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'HomeAndConstructionBusiness',
              name: 'Contigo Constructions Pty Ltd',
              url: 'https://contigoconstructions.com.au',
              telephone: '+61406274096',
              email: 'contact@contigoconstructions.com.au',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '76 Coorara Avenue',
                addressLocality: 'Payneham South',
                addressRegion: 'SA',
                postalCode: '5070',
                addressCountry: 'AU',
              },
              areaServed: {
                '@type': 'City',
                name: 'Adelaide, South Australia',
                sameAs: 'https://en.wikipedia.org/wiki/Adelaide',
              },
              image: 'https://contigoconstructions.com.au/og-image.jpg',
              sameAs: [
                'https://www.instagram.com/contigoconstructionsptyltd',
                'https://www.facebook.com/ContigoConstructions',
                'https://www.linkedin.com/company/contigo-constructions-pty-ltd',
                'https://www.tiktok.com/@contigoconstructions',
              ],
              knowsAbout: [
                'Carpentry',
                'Cladding',
                'Gyprock Fixing & Flushing',
                'Home Renovations',
                'Home Extensions',
              ],
              description:
                'Licensed Carpentry & Joinery contractor in Adelaide specialising in renovations, home extensions, pergolas, decking, framing and cladding. Committed to delivering exceptional craftsmanship, honest communication and personalised service.',
              foundingDate: '2026-05-13',
              numberOfEmployees: {
                '@type': 'QuantitativeValue',
                value: 5,
              },
              identifier: {
                '@type': 'PropertyValue',
                propertyID: 'ABN',
                value: '25698028394',
              },
              certification: {
                '@type': 'Certification',
                certificationId: '360639',
                name: 'Master Builders South Australia - BLD Licence',
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '07:00',
                closes: '17:00',
              },
            }),
          }}
          strategy="beforeInteractive"
        />
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  )
}
