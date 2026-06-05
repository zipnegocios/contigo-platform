import OpenAI from 'openai'
import { IEmbeddingService } from '@/core/services/IEmbeddingService'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class OpenAIEmbeddingService implements IEmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    })

    const embedding = response.data[0]?.embedding

    if (!embedding) {
      throw new Error('Failed to generate embedding from OpenAI')
    }

    return embedding
  }
}
