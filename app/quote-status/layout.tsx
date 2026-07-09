import { SimpleHeader } from '@/presentation/components/SimpleHeader'
import Footer from '@/presentation/sections/FooterServer'

export default function QuoteStatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SimpleHeader />
      {children}
      <Footer />
    </>
  )
}
