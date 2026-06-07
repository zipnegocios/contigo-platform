import { CustomCursor } from '@/presentation/components/CustomCursor'

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CustomCursor />
      {children}
    </>
  )
}
