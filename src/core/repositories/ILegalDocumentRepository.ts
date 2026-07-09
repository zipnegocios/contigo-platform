import { LegalDocument } from '../entities/LegalDocument'

export interface ILegalDocumentRepository {
  findById(id: string): Promise<LegalDocument | null>
  // Currently live version for public rendering.
  getPublished(slug: string): Promise<LegalDocument | null>
  // Version that was in effect at a given point in time (temporal lookup —
  // e.g. "what did the Privacy Policy say on the date this quote was sent").
  getVersionEffectiveAt(slug: string, date: Date): Promise<LegalDocument | null>
  // Latest version per slug regardless of status — feeds the admin list.
  listCurrent(): Promise<LegalDocument[]>
  // Only slugs with a live published version — feeds the /legal index and
  // the footer, so a document that never got past draft never shows a link.
  listPublished(): Promise<LegalDocument[]>
  listVersions(slug: string): Promise<LegalDocument[]>
  // Highest version number recorded for a slug, or 0 if none exists yet.
  getMaxVersion(slug: string): Promise<number>
  // Inserts a new draft row. Never used for existing rows.
  save(document: LegalDocument): Promise<void>
  // Guarded: throws if the persisted row is published/archived, or if the
  // persisted row is in_review and the diff touches anything beyond
  // reviewNote/status.
  update(document: LegalDocument): Promise<void>
  // Transactional: sets this row to published, archives the slug's
  // previously published row (if any).
  publish(document: LegalDocument): Promise<void>
}
