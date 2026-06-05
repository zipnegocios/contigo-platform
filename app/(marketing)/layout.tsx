import { CustomCursor } from '@/presentation/components/CustomCursor'

export default function MarketingLayout({
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
