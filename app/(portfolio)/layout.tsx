import { CustomCursor } from '@/presentation/components/CustomCursor'
import { SimpleHeader } from '@/presentation/components/SimpleHeader'
import Footer from '@/presentation/sections/Footer'

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CustomCursor />
      <SimpleHeader />
      {children}
      <Footer />
    </>
  )
}
