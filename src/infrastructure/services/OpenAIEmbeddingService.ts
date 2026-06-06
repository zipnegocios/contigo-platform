import OpenAI from 'openai'
import { IEmbeddingService } from '@/core/services/IEmbeddingService'

let openaiInstance: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (openaiInstance) return openaiInstance
  openaiInstance = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  return openaiInstance
}

export class OpenAIEmbeddingService implements IEmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const openai = getOpenAI()
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
