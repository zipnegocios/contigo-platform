import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { GetPublishedLegalDocumentUseCase } from '@/application/use-cases/legal/GetPublishedLegalDocumentUseCase'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import { legalMarkdownRemarkPlugins, legalMarkdownRehypePlugins } from '@/infrastructure/markdown/legal-markdown'
import type { LegalDomain } from '@/core/entities/LegalDocument'

export const revalidate = 3600

const DOMAIN_SUBTITLE: Record<LegalDomain, string> = {
  website: 'Applies to: use of this website',
  service: 'Applies to: our construction services',
  general: 'Applies to: this website and our construction services',
}

export async function generateStaticParams() {
  try {
    if (!process.env.DATABASE_URL) return []
    const documents = await new ListLegalDocumentsUseCase(new DrizzleLegalDocumentRepository()).published()
    return documents.map((doc) => ({ slug: doc.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const doc = await new GetPublishedLegalDocumentUseCase(new DrizzleLegalDocumentRepository()).execute(slug)
  if (!doc) return {}

  return {
    title: `${doc.title} | Contigo Constructions`,
    description: `${doc.title} for Contigo Constructions.`,
    alternates: { canonical: `https://contigoconstructions.com.au/legal/${doc.slug}` },
  }
}

export default async function LegalDocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = await new GetPublishedLegalDocumentUseCase(new DrizzleLegalDocumentRepository()).execute(slug)
  if (!doc) notFound()

  return (
    <div style={{ backgroundColor: 'var(--neutral-50)', minHeight: '100vh' }} className="legal-document-page">
      <style>{`
        @media print {
          header, footer, [data-print-hidden] { display: none !important; }
          .legal-document-page { background: white !important; }
          .legal-document-page * { animation: none !important; }
        }
      `}</style>
      <article
        className="max-w-3xl mx-auto page-padding prose prose-neutral"
        style={{ padding: 'clamp(4rem, 8vw, 6rem) clamp(1.5rem, 4vw, 4rem)' }}
      >
        <p className="text-fluid-xs uppercase tracking-wide not-prose" style={{ color: 'var(--neutral-500)', letterSpacing: '0.04em' }}>
          {DOMAIN_SUBTITLE[doc.domain]}
        </p>
        <h1 className="text-fluid-4xl font-display" style={{ color: 'var(--neutral-800)' }}>
          {doc.title}
        </h1>
        {doc.effectiveDate && (
          <p className="text-fluid-sm not-prose" style={{ color: 'var(--neutral-500)' }}>
            Last updated:{' '}
            {doc.effectiveDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
        <ReactMarkdown remarkPlugins={legalMarkdownRemarkPlugins} rehypePlugins={legalMarkdownRehypePlugins}>
          {doc.content}
        </ReactMarkdown>
        <div dangerouslySetInnerHTML={{ __html: `<!-- v${doc.version} ${doc.contentHash ?? ''} -->` }} />
      </article>
    </div>
  )
}
