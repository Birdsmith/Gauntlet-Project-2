import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

// Initialize the LLM with GPT-4
export const llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  streaming: true,
  apiKey: process.env.OPENAI_API_KEY,
})

// Create a base prompt template for CRM operations
export const baseCrmPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an AI assistant helping with CRM operations. Your role is to:
1. Understand user requests related to CRM data
2. Identify required actions and entities
3. Validate permissions and business rules
4. Execute changes safely and provide clear feedback

Always be professional, clear, and precise in your responses.
If you're unsure about any action, ask for clarification.
Never make assumptions about data or permissions.`,
  ],
  ['human', '{input}'],
])

// Create a chain for basic responses
export const baseCrmChain = baseCrmPrompt.pipe(llm).pipe(new StringOutputParser())

// Helper function to stream responses
export async function* streamResponse(input: string) {
  const stream = await llm.stream(input)
  for await (const chunk of stream) {
    yield chunk.content
  }
}
