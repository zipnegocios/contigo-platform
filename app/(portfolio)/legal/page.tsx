import { Metadata } from 'next'
import Link from 'next/link'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import type { LegalDomain } from '@/core/entities/LegalDocument'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Legal | Contigo Constructions',
  description: 'Terms, policies, and disclosures governing this website and our construction services.',
  alternates: { canonical: 'https://contigoconstructions.com.au/legal' },
}

const DOMAIN_LABELS: Record<LegalDomain, string> = {
  website: 'This Website',
  service: 'Our Construction Services',
  general: 'General',
}

export default async function LegalIndexPage() {
  let documents: Awaited<ReturnType<ListLegalDocumentsUseCase['published']>> = []
  try {
    if (process.env.DATABASE_URL) {
      documents = await new ListLegalDocumentsUseCase(new DrizzleLegalDocumentRepository()).published()
    }
  } catch (error) {
    console.error('Error fetching published legal documents:', error)
  }

  const grouped = documents.reduce<Record<LegalDomain, typeof documents>>(
    (acc, doc) => {
      acc[doc.domain] = [...(acc[doc.domain] ?? []), doc]
      return acc
    },
    { website: [], service: [], general: [] },
  )

  return (
    <div style={{ backgroundColor: 'var(--neutral-50)', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto page-padding" style={{ padding: 'clamp(4rem, 8vw, 6rem) clamp(1.5rem, 4vw, 4rem)' }}>
        <h1 className="text-fluid-4xl font-display" style={{ color: 'var(--neutral-800)' }}>
          Legal
        </h1>
        <p className="text-fluid-base mt-4" style={{ color: 'var(--neutral-600)' }}>
          Terms, policies, and disclosures that govern this website and the construction services Contigo
          Constructions provides.
        </p>

        {(['website', 'service', 'general'] as LegalDomain[]).map((domain) =>
          grouped[domain].length === 0 ? null : (
            <section key={domain} className="mt-10">
              <h2
                className="text-fluid-sm uppercase tracking-wide"
                style={{ color: 'var(--neutral-500)', letterSpacing: '0.04em' }}
              >
                {DOMAIN_LABELS[domain]}
              </h2>
              <ul className="mt-4 flex flex-col gap-1" style={{ borderTop: '1px solid var(--neutral-200)' }}>
                {grouped[domain].map((doc) => (
                  <li key={doc.slug} style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                    <Link
                      href={`/legal/${doc.slug}`}
                      className="flex items-center justify-between py-4 text-fluid-lg transition-colors hover:underline"
                      style={{ color: 'var(--neutral-800)' }}
                    >
                      <span>{doc.title}</span>
                      {doc.effectiveDate && (
                        <span className="text-fluid-xs" style={{ color: 'var(--neutral-500)' }}>
                          Last updated {doc.effectiveDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
      </div>
    </div>
  )
}
