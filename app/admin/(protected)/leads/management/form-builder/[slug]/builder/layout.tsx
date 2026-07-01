export default function FormBuilderLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">{children}</div>
}
