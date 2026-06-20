import { LeadNote } from '@/core/entities/LeadNote'
import { ILeadNoteRepository } from '@/core/repositories/ILeadNoteRepository'

export class ArchiveLeadNoteUseCase {
  constructor(private leadNoteRepository: ILeadNoteRepository) {}

  async execute(noteId: string): Promise<LeadNote> {
    const note = await this.leadNoteRepository.findById(noteId)
    if (!note) throw new Error('Lead note not found')

    const archived = note.archive()
    await this.leadNoteRepository.update(archived)
    return archived
  }
}
