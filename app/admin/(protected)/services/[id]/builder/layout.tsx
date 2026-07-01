export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#F5EFE8' }}>
      {children}
    </div>
  )
}
