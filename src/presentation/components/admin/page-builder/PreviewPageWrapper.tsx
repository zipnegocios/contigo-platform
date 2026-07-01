import { logoPaths, LOGO_VIEWBOX } from '@/presentation/components/logo-paths'

const NAV_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
]

function MockHeader() {
  return (
    <header
      className="w-full flex items-center justify-between page-padding py-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <svg
        viewBox={LOGO_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '14rem', height: 'auto', color: '#0D3C4C' }}
      >
        <g fill="currentColor">{logoPaths}</g>
      </svg>

      <nav className="hidden lg:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <span
            key={link.href}
            className="text-fluid-sm font-medium"
            style={{ color: '#0d3c4c' }}
          >
            {link.label}
          </span>
        ))}
        <span className="text-fluid-sm font-medium" style={{ color: '#0d3c4c' }}>Contact</span>
      </nav>

      <div
        className="px-5 py-2 rounded-full text-fluid-xs font-semibold"
        style={{ backgroundColor: '#E2C063', color: '#1E1A16' }}
      >
        Request a Quote
      </div>
    </header>
  )
}

function MockFooter() {
  return (
    <footer
      className="w-full py-12 px-8"
      style={{ backgroundColor: '#1E1A16', color: 'rgba(255,255,255,0.6)' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div>
          <svg
            viewBox={LOGO_VIEWBOX}
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '12rem', height: 'auto', color: '#E2C063', marginBottom: '1rem' }}
          >
            <g fill="currentColor">{logoPaths}</g>
          </svg>
          <p className="text-fluid-xs max-w-xs">
            Premium construction and renovation services across Sydney and surrounds.
          </p>
        </div>

        <div className="flex gap-12">
          {[
            { title: 'Services', links: ['Carpentry', 'Cladding', 'Gyprock'] },
            { title: 'Company', links: ['About', 'Projects', 'Contact'] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-fluid-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {col.title}
              </p>
              {col.links.map((l) => (
                <p key={l} className="text-fluid-xs mb-2">{l}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto mt-8 pt-6 text-fluid-xs"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        © {new Date().getFullYear()} Contigo. All rights reserved.
      </div>
    </footer>
  )
}

export function PreviewPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white min-h-screen">
      <MockHeader />
      <main>{children}</main>
      <MockFooter />
    </div>
  )
}
