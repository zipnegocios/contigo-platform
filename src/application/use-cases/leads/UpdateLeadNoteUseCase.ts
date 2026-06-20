import { LeadNote } from '@/core/entities/LeadNote'
import { ILeadNoteRepository } from '@/core/repositories/ILeadNoteRepository'

export class UpdateLeadNoteUseCase {
  constructor(private leadNoteRepository: ILeadNoteRepository) {}

  async execute(noteId: string, body: string): Promise<LeadNote> {
    const note = await this.leadNoteRepository.findById(noteId)
    if (!note) throw new Error('Lead note not found')

    const updated = note.withBody(body)
    await this.leadNoteRepository.update(updated)
    return updated
  }
}
