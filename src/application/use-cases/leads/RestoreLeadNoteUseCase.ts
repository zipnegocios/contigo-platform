import { LeadNote } from '@/core/entities/LeadNote'
import { ILeadNoteRepository } from '@/core/repositories/ILeadNoteRepository'

export class RestoreLeadNoteUseCase {
  constructor(private leadNoteRepository: ILeadNoteRepository) {}

  async execute(noteId: string): Promise<LeadNote> {
    const note = await this.leadNoteRepository.findById(noteId)
    if (!note) throw new Error('Lead note not found')

    const restored = note.restore()
    await this.leadNoteRepository.update(restored)
    return restored
  }
}
