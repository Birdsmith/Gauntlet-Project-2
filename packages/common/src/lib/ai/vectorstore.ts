import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseClient } from '@supabase/supabase-js'
import { Document } from '@langchain/core/documents'
import { Database } from '../types/database.types'
import { Logger } from '../utils/logger'

export class VectorStore {
  private store: SupabaseVectorStore
  private embeddings: OpenAIEmbeddings

  constructor(private supabase: SupabaseClient<Database>) {
    // Initialize embeddings with API key from environment
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      Logger.error('OpenAI API key not found', {
        category: 'AI',
        metadata: {
          keyExists: false,
        },
      })
      throw new Error('OpenAI API key not found in environment variables')
    }

    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      apiKey: apiKey,
    })

    this.store = new SupabaseVectorStore(this.embeddings, {
      client: this.supabase,
      tableName: 'document_embeddings',
      queryName: 'match_documents',
    })
  }

  async addDocuments(documents: Document[]) {
    return this.store.addDocuments(documents)
  }

  async similaritySearch(query: string, k = 4) {
    return this.store.similaritySearch(query, k)
  }

  async similaritySearchWithScore(query: string, k = 4) {
    return this.store.similaritySearchWithScore(query, k)
  }
}
