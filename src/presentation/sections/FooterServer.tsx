// Server wrapper: fetches the published legal documents (only slugs with a
// live version show up — a document stuck in draft never links to a 404)
// and hands them to the client Footer for rendering.
import { DrizzleLegalDocumentRepository } from '@/infrastructure/repositories/DrizzleLegalDocumentRepository'
import { ListLegalDocumentsUseCase } from '@/application/use-cases/legal/ListLegalDocumentsUseCase'
import Footer from './Footer'

export default async function FooterServer() {
  const documents = await new ListLegalDocumentsUseCase(new DrizzleLegalDocumentRepository()).published()
  const legalLinks = documents.map((doc) => ({ slug: doc.slug, title: doc.title, domain: doc.domain }))
  return <Footer legalLinks={legalLinks} />
}
