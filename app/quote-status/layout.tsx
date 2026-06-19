import { SimpleHeader } from '@/presentation/components/SimpleHeader'
import Footer from '@/presentation/sections/Footer'

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
