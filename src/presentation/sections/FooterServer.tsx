// Server wrapper: fetches the published legal documents (only slugs with a
// live version show up — a document stuck in draft never links to a 404)
// and hands them to the client Footer for rendering.
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import Footer from './Footer'

export default async function FooterServer() {
  let legalLinks: Array<{ slug: string; title: string; domain: 'website' | 'service' | 'general' }> = []
  try {
    if (process.env.DATABASE_URL) {
      const documents = await new ListLegalDocumentsUseCase(new DrizzleLegalDocumentRepository()).published()
      legalLinks = documents.map((doc) => ({ slug: doc.slug, title: doc.title, domain: doc.domain }))
    }
  } catch (error) {
    console.error('Error fetching legal links for footer:', error)
  }
  return <Footer legalLinks={legalLinks} />
}
