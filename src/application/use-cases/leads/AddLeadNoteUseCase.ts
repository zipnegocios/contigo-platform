import { LeadNote } from '@/core/entities/LeadNote'
import { LeadActivity } from '@/core/entities/LeadActivity'
import { ILeadNoteRepository } from '@/core/repositories/ILeadNoteRepository'
import { ILeadActivityRepository } from '@/core/repositories/ILeadActivityRepository'

export class AddLeadNoteUseCase {
  constructor(
    private leadNoteRepository: ILeadNoteRepository,
    private leadActivityRepository: ILeadActivityRepository,
  ) {}

  async execute(input: { leadId: string; body: string; createdBy?: string }): Promise<LeadNote> {
    const note = LeadNote.create(input)
    await this.leadNoteRepository.save(note)

    const activity = LeadActivity.create({
      leadId: input.leadId,
      type: 'note',
      payload: { noteId: note.id },
      createdBy: input.createdBy,
    })
    await this.leadActivityRepository.save(activity)

    return note
  }
}
