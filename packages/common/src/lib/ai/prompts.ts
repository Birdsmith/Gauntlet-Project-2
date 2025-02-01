import { ChatPromptTemplate } from '@langchain/core/prompts'
import { Database } from '../types/database.types'

type Tables = keyof Database['public']['Tables']

// Base system prompt for all CRM operations
const systemPrompt = `You are an AI assistant helping with CRM operations. Your role is to:
1. Understand user requests related to CRM data
2. Identify required actions and entities
3. Validate permissions and business rules
4. Execute changes safely and provide clear feedback

Important Guidelines:
1. NEVER make automatic queries or take actions without explicit user requests
2. Wait for specific user requests before accessing or modifying data
3. Do not assume what information to show - only respond to explicit queries
4. Always be professional, clear, and precise in your responses
5. If you're unsure about any action, ask for clarification
6. Never make assumptions about data or permissions

Available tables: {tables}
Current context: {context}`

// Prompt for understanding user intent
export const intentPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  ['human', '{input}'],
  ['assistant', 'Let me analyze your request.'],
  ['human', 'What would you like me to help you with?'],
])

// Prompt for data retrieval operations
export const retrievalPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  ['human', '{input}'],
  ['assistant', "I'll help you find that information."],
  ['human', 'What specific data are you looking for?'],
])

// Prompt for data modification operations
export const modificationPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  ['human', '{input}'],
  ['assistant', "I'll help you make those changes."],
  ['human', "Please confirm the changes you'd like to make:"],
])

// Prompt for action planning
export const planningPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  ['human', '{input}'],
  ['assistant', 'Let me create a plan for this operation.'],
  ['human', 'What steps will be involved?'],
])

// Helper function to format available tables
export function formatTableList(tables: Tables[]): string {
  return tables.map((table) => `- ${table}: ${describeTable(table)}`).join('\n')
}

// Helper function to describe tables
function describeTable(table: Tables): string {
  const descriptions: Record<Tables, string> = {
    chat_sessions: 'Chat conversations with context and metadata',
    chat_messages: 'Individual messages in chat sessions',
    crm_actions: 'Tracked CRM operations and their status',
    document_embeddings: 'Embedded documents for semantic search',
    ticket: 'Support tickets and their details',
    comment: 'Comments on tickets',
    interaction: 'Customer interactions and communications',
    organization: 'Customer organizations and their details',
    tag: 'Labels and categories for tickets',
    ticket_assignment: 'Agent assignments to tickets',
    ticket_history: 'Changes and updates to tickets',
    ticket_tag: 'Tags associated with tickets',
    user: 'System users including agents and customers',
  }

  return descriptions[table]
}
