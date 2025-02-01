import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatOpenAI } from '@langchain/openai'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { z } from 'zod'
import { ConversationMemory } from './memory'
import { VectorStore } from './vectorstore'
import { ChatService } from '../services/chat.service'
import { Database } from '../types/database.types'
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import { IntentClassifier } from './classifier'
import { Logger } from '../utils/logger'
import { Json, ChatMessage } from '../types/chat.types'
import { v4 as uuidv4 } from 'uuid'
import { Client } from 'langsmith'

// Initialize LangSmith client and tracing
const langsmithApiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY
const langchainEndpoint = process.env.NEXT_PUBLIC_LANGCHAIN_ENDPOINT
const langchainProject = process.env.NEXT_PUBLIC_LANGCHAIN_PROJECT

if (!langsmithApiKey) {
  Logger.warn('LangSmith API key not found. Tracing will be disabled.', { category: 'AI' })
} else {
  // Set up LangSmith environment
  process.env.LANGCHAIN_TRACING_V2 = 'true'
  process.env.LANGCHAIN_API_KEY = langsmithApiKey
  process.env.LANGCHAIN_ENDPOINT = langchainEndpoint || 'https://api.smith.langchain.com'
  process.env.LANGCHAIN_PROJECT = langchainProject || 'gauntlet-project-2'

  Logger.info('LangSmith tracing enabled', {
    category: 'AI',
    metadata: {
      endpoint: process.env.LANGCHAIN_ENDPOINT,
      project: process.env.LANGCHAIN_PROJECT,
    },
  })
}

// Initialize LangSmith client
const client = new Client({
  apiKey: langsmithApiKey,
})

// Helper function to convert errors to JSON-safe objects
export function errorToJson(error: unknown): Json {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  if (error instanceof PostgrestError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    }
  }
  return {
    message: String(error),
  }
}

// Helper function to convert role to LangChain message
function createMessage(role: ChatMessage['role'], content: string) {
  switch (role) {
    case 'user':
      return new HumanMessage(content)
    case 'assistant':
      return new AIMessage(content)
    case 'system':
      return new SystemMessage(content)
  }
}

// Define the base system prompt
const SYSTEM_PROMPT = `You are an AI assistant helping with CRM operations. Your role is to:
1. Be concise and direct in responses
2. Only show relevant information
3. Omit IDs unless specifically requested
4. Focus on what matters to the user

IMPORTANT RULES:
- Keep responses brief but helpful
- Only mention ticket IDs if explicitly asked
- When users mention messages/conversations/communications, treat them as chat interactions
- Focus on the user's immediate needs
- Be direct - don't ask for confirmation unless truly needed
- NEVER apply default filters - show ALL tickets by default
- When querying tickets, return ALL statuses unless the user explicitly requests a specific status
- When using tools, ensure all required parameters are provided and valid
- For interactions, always use type: 'chat' regardless of how the user refers to it (message/conversation/etc)

CONVERSATION TRACKING:
- Always maintain awareness of which ticket is currently being discussed
- When switching to a different ticket, acknowledge the context switch
- If the user refers to "this ticket" or "the ticket", use the last mentioned ticket ID
- If context is unclear, ask for clarification about which ticket they're referring to
- Keep track of recent actions performed on the current ticket
- When suggesting next steps, consider the ticket's current state and history
- If a conversation spans multiple tickets, clearly indicate which ticket you're referring to

You have access to the following tools:
- createTicket: Create a new support ticket with title, description, and priority
- queryTickets: Search for tickets based on various criteria
- updateTicket: Update ticket fields (requires valid ticket ID)
- addComment: Add a comment to a ticket (requires valid ticket ID)
- createInteraction: Log customer communications (requires valid ticket ID, always use type: 'chat')
- getTicketInteractions: Get all interactions for a ticket
- getTicketMetrics: Get detailed metrics about a ticket
- suggestTags: Get AI-suggested tags for a ticket
- sendPasswordResetEmail: Send password reset email to users`

interface CommentResponse {
  id: string
  content: string
  ticket_id: string
  is_internal: boolean
  created_at: string
  user_id: string
}

interface UpdateChatSessionParams {
  status?: NonNullable<Database['public']['Tables']['chat_sessions']['Row']['status']>
  title?: string
  metadata?: Json
  ticketId?: string | null
}

export class CRMAgent {
  private agent: AgentExecutor | null = null
  private memory: ConversationMemory
  private vectorStore: VectorStore
  private classifier: IntentClassifier
  private model!: ChatOpenAI
  private supabase: SupabaseClient<Database>
  private sessionId: string
  private context: Array<{ role: ChatMessage['role']; content: string }>
  private metadata: Json
  private chatService: ChatService
  private langsmith: Client

  constructor(
    sessionId: string,
    supabase: SupabaseClient<Database>,
    chatService: ChatService,
    metadata: Json = {}
  ) {
    this.sessionId = sessionId
    this.metadata = metadata
    this.context = []
    this.supabase = supabase
    this.chatService = chatService
    this.langsmith = client

    // Initialize components
    this.memory = new ConversationMemory(this.chatService, this.sessionId)
    this.vectorStore = new VectorStore(this.supabase)
    this.classifier = new IntentClassifier()

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      Logger.error('OpenAI API key not found', {
        category: 'AI',
        metadata: { keyExists: false },
      })
      return
    }

    this.model = new ChatOpenAI({
      modelName: 'gpt-4-1106-preview',
      temperature: 0.7,
      maxTokens: 1000,
      apiKey,
    })

    // Create the agent
    this.initAgent()
  }

  private async initAgent() {
    try {
      // Load message history first
      await this.memory.loadMessages()
      this.agent = await this.createAgent()

      // Add initial welcome message if this is a new session
      if (this.memory.getMessages().length === 0) {
        await this.memory.addMessage({
          id: uuidv4(),
          sessionId: this.sessionId,
          role: 'assistant',
          content:
            'Hi! I can help you manage tickets, add comments, and track customer communications. What do you need?',
          metadata: {},
          createdAt: new Date(),
        })
      }

      Logger.info('Agent created successfully', {
        category: 'AI',
        sessionId: this.sessionId,
      })
    } catch (error) {
      Logger.error('Failed to initialize agent', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { error: errorToJson(error) },
      })
      // Don't throw here, let the agent be null and handle it in processMessage
    }
  }

  private async createAgent(): Promise<AgentExecutor> {
    Logger.info('Creating OpenAI functions agent', {
      category: 'AI',
      sessionId: this.sessionId,
    })

    // Create the prompt
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a helpful CRM assistant. Your role is to:
1. Be concise and direct
2. Show only relevant information
3. Omit technical details unless asked
4. Use natural language for interactions

When handling requests:
- Execute clear requests immediately
- Only show what's asked for
- Keep responses focused and brief
- Use terms the user prefers (e.g. message/chat/conversation)
- NEVER apply default filters - show ALL tickets by default
- Only filter tickets when explicitly requested by the user
- Always validate tool parameters before use
- For interactions, always use type: 'chat'`,
      ],
      ['system', SYSTEM_PROMPT],
      ['system', 'Previous conversation:\n{chat_history}'],
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ])

    // Define the tools
    const tools = [
      new DynamicStructuredTool({
        name: 'createTicket',
        description: 'Create a new support ticket',
        schema: z
          .object({
            title: z.string().min(1).max(255).describe('The title of the ticket'),
            description: z.string().min(1).max(10000).describe('The description of the ticket'),
            priority: z
              .enum(['low', 'medium', 'high', 'urgent'])
              .optional()
              .default('medium')
              .describe('The priority level of the ticket'),
          })
          .strict(),
        func: async ({ title, description, priority = 'medium' }) => {
          try {
            Logger.info('Creating new ticket', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { title, priority },
            })

            // Get the current user's session
            const { data: session } = await this.supabase.auth.getSession()
            if (!session?.session?.user?.id) {
              Logger.error('User not authenticated', {
                category: 'Action',
                sessionId: this.sessionId,
              })
              return JSON.stringify({
                error: 'Failed to create ticket',
                details: 'User not authenticated',
              })
            }

            const { data, error } = await this.supabase
              .from('ticket')
              .insert({
                title: title.trim(),
                description: description.trim(),
                status: 'open',
                priority,
                created_by: session.session.user.id,
              })
              .select()
              .single()

            if (error) {
              Logger.error('Error creating ticket', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: {
                  error:
                    error instanceof PostgrestError
                      ? {
                          code: error.code,
                          message: error.message,
                          details: error.details,
                          hint: error.hint,
                        }
                      : String(error),
                },
              })
              return JSON.stringify({
                error: 'Failed to create ticket',
                details: error instanceof PostgrestError ? error.message : 'Database error',
              })
            }

            Logger.info('Ticket created successfully', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { ticketId: data.id },
            })

            return JSON.stringify({
              success: true,
              ticket: data,
              message: 'Ticket created successfully',
            })
          } catch (error) {
            Logger.error('Error creating ticket', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to create ticket',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
      new DynamicStructuredTool({
        name: 'queryTickets',
        description:
          'Search for tickets. If no filters are provided, returns all tickets. Optional filters: status (open, in_progress, resolved, closed), priority (low, medium, high, urgent).',
        schema: z
          .object({
            status: z
              .enum(['open', 'in_progress', 'resolved', 'closed'])
              .optional()
              .describe(
                'Optional: The status to filter tickets by. If not provided, shows tickets of all statuses.'
              ),
            priority: z
              .enum(['low', 'medium', 'high', 'urgent'])
              .optional()
              .describe(
                'Optional: The priority level to filter tickets by. If not provided, shows tickets of all priorities.'
              ),
            assignedTo: z
              .string()
              .uuid()
              .optional()
              .describe('Optional: The UUID of the user to filter assigned tickets by'),
            query: z
              .string()
              .trim()
              .min(1)
              .optional()
              .describe('Optional: Text to search for in ticket titles'),
          })
          .strict(),
        func: async ({ status, priority, assignedTo, query }) => {
          try {
            Logger.info('Querying tickets', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { status, priority, assignedTo, query },
            })

            type UserFields = Pick<
              Database['public']['Tables']['user']['Row'],
              'id' | 'email' | 'name'
            >
            type TicketWithUsers = Database['public']['Tables']['ticket']['Row'] & {
              creator: UserFields | null
              assignee: UserFields | null
            }

            // Start building the query with proper type safety
            let builder = this.supabase
              .from('ticket')
              .select(
                `
                id,
                title,
                description,
                status,
                priority,
                created_at,
                created_by,
                assigned_to,
                creator:user!tickets_created_by_fkey (
                  id,
                  email,
                  name
                ),
                assignee:user!tickets_assigned_to_fkey (
                  id,
                  email,
                  name
                )
              `
              )
              .order('created_at', { ascending: false })
              .limit(20) // Increased limit since we're showing all by default

            // Only apply filters if explicitly provided
            if (status) {
              builder = builder.eq('status', status)
            }
            if (priority) {
              builder = builder.eq('priority', priority)
            }
            if (assignedTo) {
              builder = builder.eq('assigned_to', assignedTo)
            }
            if (query) {
              const sanitizedQuery = query
                .trim()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(Boolean)
                .join(' & ')

              if (sanitizedQuery) {
                builder = builder.textSearch('title', sanitizedQuery)
              }
            }

            const { data, error } = (await builder) as {
              data: TicketWithUsers[] | null
              error: PostgrestError | null
            }

            if (error) {
              Logger.error('Error querying tickets', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: {
                  error:
                    error instanceof PostgrestError
                      ? {
                          code: error.code,
                          message: error.message,
                          details: error.details,
                          hint: error.hint,
                        }
                      : String(error),
                  query: { status, priority, assignedTo, query },
                },
              })
              return JSON.stringify({
                error: 'Failed to query tickets',
                details: error instanceof PostgrestError ? error.message : 'Database error',
              })
            }

            if (!data || data.length === 0) {
              return JSON.stringify({
                count: 0,
                tickets: [],
                message: 'No tickets found matching the criteria',
                searchCriteria: { status, priority, assignedTo, query },
              })
            }

            // Format the response to be more descriptive
            const formattedData = data.map((ticket) => ({
                id: ticket.id,
                title: ticket.title,
                status: ticket.status,
              description: ticket.description || 'No description provided',
                createdAt: ticket.created_at,
              assignedTo: ticket.assignee?.name || 'Unassigned',
              createdBy: ticket.creator?.name || 'Unknown',
              priority: ticket.priority || 'Not set',
            }))

            return JSON.stringify({
              count: formattedData.length,
              tickets: formattedData,
              searchCriteria: { status, priority, assignedTo, query },
            })
          } catch (error) {
            Logger.error('Error querying tickets', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to query tickets',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
      new DynamicStructuredTool({
        name: 'updateTicket',
        description: 'Update ticket fields such as status, priority, title, or description',
        schema: z
          .object({
            ticketId: z.string().uuid().describe('The UUID of the ticket to update'),
            changes: z
              .object({
                status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
                priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
                title: z.string().min(1).max(255).optional(),
                description: z.string().optional(),
                assigned_to: z.string().uuid().optional(),
              })
              .strict(),
          })
          .strict(),
        func: async ({ ticketId, changes }) => {
          try {
          Logger.info('Updating ticket', {
            category: 'Action',
            sessionId: this.sessionId,
            metadata: { ticketId, changes },
          })

            // Validate that the ticket exists first
            const { data: existingTicket, error: checkError } = await this.supabase
              .from('ticket')
              .select('id')
              .eq('id', ticketId)
              .single()

            if (checkError || !existingTicket) {
              Logger.error('Ticket not found', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: { ticketId },
              })
              return JSON.stringify({
                error: 'Failed to update ticket',
                details: 'Ticket not found',
              })
            }

          const { data, error } = await this.supabase
            .from('ticket')
            .update(changes)
            .eq('id', ticketId)
            .select()
            .single()

          if (error) {
            Logger.error('Error updating ticket', {
              category: 'Action',
              sessionId: this.sessionId,
                metadata: {
                  error:
                    error instanceof PostgrestError
                      ? {
                          code: error.code,
                          message: error.message,
                          details: error.details,
                          hint: error.hint,
                        }
                      : String(error),
                  ticketId,
                  changes,
                },
              })
              return JSON.stringify({
                error: 'Failed to update ticket',
                details: error instanceof PostgrestError ? error.message : 'Database error',
              })
            }

            Logger.info('Ticket updated successfully', {
            category: 'Action',
            sessionId: this.sessionId,
              metadata: { ticketId, updatedData: data },
            })

            return JSON.stringify({
              success: true,
              ticket: data,
              message: 'Ticket updated successfully',
            })
          } catch (error) {
            Logger.error('Error updating ticket', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to update ticket',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
      new DynamicStructuredTool({
        name: 'addComment',
        description:
          'Add a comment to a ticket. Comments can be marked as internal for staff-only visibility.',
        schema: z
          .object({
            ticketId: z.string().uuid().describe('The UUID of the ticket to comment on'),
            content: z.string().min(1).max(10000).describe('The content of the comment'),
            isInternal: z
              .boolean()
              .optional()
              .default(false)
              .describe('Whether this is an internal comment (staff-only)'),
          })
          .strict(),
        func: async ({ ticketId, content, isInternal }) => {
          try {
          Logger.info('Adding comment to ticket', {
            category: 'Action',
            sessionId: this.sessionId,
              metadata: { ticketId, contentLength: content.length, isInternal },
            })

            // Validate that the ticket exists first
            const { data: existingTicket, error: checkError } = await this.supabase
              .from('ticket')
              .select('id')
              .eq('id', ticketId)
              .single()

            if (checkError || !existingTicket) {
              Logger.error('Ticket not found', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: { ticketId },
              })
              return JSON.stringify({
                error: 'Failed to add comment',
                details: 'Ticket not found',
              })
            }

            // Get the current user's session
            const { data: session } = await this.supabase.auth.getSession()
            if (!session?.session?.user?.id) {
              Logger.error('User not authenticated', {
                category: 'Action',
                sessionId: this.sessionId,
              })
              return JSON.stringify({
                error: 'Failed to add comment',
                details: 'User not authenticated',
              })
            }

            type CommentResult = { data: CommentResponse | null; error: PostgrestError | null }
          const { data, error } = (await this.supabase
            .from('comment')
            .insert({
              ticket_id: ticketId,
                content: content.trim(),
              is_internal: isInternal || false,
                user_id: session.session.user.id,
            })
            .select()
            .single()) as CommentResult

          if (error) {
            Logger.error('Error adding comment', {
              category: 'Action',
              sessionId: this.sessionId,
                metadata: {
                  error:
                    error instanceof PostgrestError
                      ? {
                          code: error.code,
                          message: error.message,
                          details: error.details,
                          hint: error.hint,
                        }
                      : String(error),
                  ticketId,
                },
              })
              return JSON.stringify({
                error: 'Failed to add comment',
                details: error instanceof PostgrestError ? error.message : 'Database error',
              })
            }

            Logger.info('Comment added successfully', {
            category: 'Action',
            sessionId: this.sessionId,
            metadata: { ticketId, commentId: data?.id },
          })

            return JSON.stringify({
              success: true,
              comment: data,
              message: 'Comment added successfully',
            })
          } catch (error) {
            Logger.error('Error adding comment', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to add comment',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
      new DynamicStructuredTool({
        name: 'createInteraction',
        description:
          'Log customer communications. When users mention messages, conversations, or general communications, use type: chat.',
        schema: z
          .object({
            ticketId: z
              .string()
              .uuid()
              .describe('The UUID of the ticket to create an interaction for'),
            type: z.enum(['chat']).describe('Always use type: chat for all communications'),
            summary: z.string().min(1).max(10000).describe('What happened during the interaction'),
          })
          .strict(),
        func: async ({ ticketId, type, summary }) => {
          try {
          Logger.info('Creating interaction', {
            category: 'Action',
            sessionId: this.sessionId,
              metadata: { ticketId, type, summaryLength: summary.length },
            })

            // Validate that the ticket exists first
            const { data: existingTicket, error: checkError } = await this.supabase
              .from('ticket')
              .select('id')
              .eq('id', ticketId)
              .single()

            if (checkError || !existingTicket) {
              Logger.error('Ticket not found', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: { ticketId },
              })
              return JSON.stringify({
                error: 'Failed to create interaction',
                details: 'Ticket not found',
              })
            }

            // Get the current user's session
          const { data: session } = await this.supabase.auth.getSession()
          if (!session?.session?.user?.id) {
            Logger.error('User not authenticated', {
              category: 'Action',
              sessionId: this.sessionId,
            })
              return JSON.stringify({
                error: 'Failed to create interaction',
                details: 'User not authenticated',
              })
            }

            type InteractionResult = {
              data: Database['public']['Tables']['interaction']['Row'] | null
              error: PostgrestError | null
            }

            const { data, error } = (await this.supabase
            .from('interaction')
            .insert({
              ticket_id: ticketId,
              interaction_type: type,
                content: summary.trim(),
              user_id: session.session.user.id,
            })
            .select()
              .single()) as InteractionResult

          if (error) {
            Logger.error('Error creating interaction', {
              category: 'Action',
              sessionId: this.sessionId,
                metadata: {
                  error:
                    error instanceof PostgrestError
                      ? {
                          code: error.code,
                          message: error.message,
                          details: error.details,
                          hint: error.hint,
                        }
                      : String(error),
                  ticketId,
                },
              })
              return JSON.stringify({
                error: 'Failed to create interaction',
                details: error instanceof PostgrestError ? error.message : 'Database error',
              })
            }

            Logger.info('Interaction created successfully', {
            category: 'Action',
            sessionId: this.sessionId,
            metadata: { ticketId, interactionId: data?.id },
          })

            return JSON.stringify({
              success: true,
              interaction: data,
              message: `Successfully logged ${type} interaction with ticket ${ticketId}`,
            })
          } catch (error) {
            Logger.error('Error creating interaction', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to create interaction',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
      new DynamicStructuredTool({
        name: 'getTicketInteractions',
        description: 'Retrieves all interactions/messages associated with a specific ticket',
        schema: z
          .object({
            ticketId: z.string().uuid().describe('The UUID of the ticket to get interactions for'),
            limit: z
              .number()
              .min(1)
              .max(100)
              .optional()
              .default(20)
              .describe('Maximum number of interactions to return'),
            offset: z
              .number()
              .min(0)
              .optional()
              .default(0)
              .describe('Number of interactions to skip for pagination'),
          })
          .strict(),
        func: async ({ ticketId, limit = 20, offset = 0 }) => {
          try {
            Logger.info('Retrieving ticket interactions', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { ticketId, limit, offset },
            })

            // First verify the ticket exists
            const { data: ticket, error: ticketError } = await this.supabase
              .from('ticket')
              .select('id')
              .eq('id', ticketId)
              .single()

            if (ticketError || !ticket) {
              Logger.error('Ticket not found', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: { ticketId },
              })
              return JSON.stringify({
                error: 'Failed to get interactions',
                details: 'Ticket not found',
              })
            }

            // Get interactions with user details
            const { data, error } = await this.supabase
              .from('interaction')
              .select(
                `
                id,
                content,
                interaction_type,
                created_at,
                user:user (
                  id,
                  name,
                  email
                )
              `
              )
              .eq('ticket_id', ticketId)
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1)

            if (error) {
              Logger.error('Error retrieving interactions', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: {
                  error:
                    error instanceof PostgrestError
                      ? {
                          code: error.code,
                          message: error.message,
                          details: error.details,
                          hint: error.hint,
                        }
                      : String(error),
                  ticketId,
                },
              })
              return JSON.stringify({
                error: 'Failed to get interactions',
                details: error instanceof PostgrestError ? error.message : 'Database error',
              })
            }

            if (!data || data.length === 0) {
              return JSON.stringify({
                count: 0,
                interactions: [],
                message: 'No interactions found for this ticket',
              })
            }

            // Format the interactions
            const formattedInteractions = data.map((interaction) => ({
              id: interaction.id,
              type: interaction.interaction_type,
              content: interaction.content,
              createdAt: interaction.created_at,
              user: interaction.user
                ? {
                    name: interaction.user.name || 'Unknown',
                    email: interaction.user.email,
                  }
                : null,
            }))

            return JSON.stringify({
              count: formattedInteractions.length,
              interactions: formattedInteractions,
              hasMore: formattedInteractions.length === limit,
            })
          } catch (error) {
            Logger.error('Error retrieving interactions', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to get interactions',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
      new DynamicStructuredTool({
        name: 'sendPasswordResetEmail',
        description: 'Sends a password reset email to a user',
        schema: z
          .object({
            email: z.string().email().describe('The email address of the user'),
            redirectTo: z
              .string()
              .url()
              .optional()
              .describe('Optional URL to redirect to after password reset'),
          })
          .strict(),
        func: async ({ email, redirectTo }) => {
          try {
            Logger.info('Sending password reset email', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { email },
            })

            // First verify the user exists
            const { data: user, error: userError } = await this.supabase
              .from('user')
              .select('id, email')
              .eq('email', email)
              .single()

            if (userError || !user) {
              Logger.error('User not found', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: { email },
              })
              return JSON.stringify({
                error: 'Failed to send password reset email',
                details: 'User not found',
              })
            }

            const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
              redirectTo,
            })

            if (error) {
              Logger.error('Error sending password reset email', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: {
                  error:
                    error instanceof Error
                      ? {
                          name: error.name,
                          message: error.message,
                        }
                      : String(error),
                  email,
                },
              })
              return JSON.stringify({
                error: 'Failed to send password reset email',
                details: error instanceof Error ? error.message : 'Authentication error',
              })
            }

            Logger.info('Password reset email sent successfully', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { email },
            })

            return JSON.stringify({
              success: true,
              message: 'Password reset email sent successfully',
            })
          } catch (error) {
            Logger.error('Error sending password reset email', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to send password reset email',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
      new DynamicStructuredTool({
        name: 'getTicketMetrics',
        description: 'Retrieves metrics about a ticket like response times, resolution time, etc.',
        schema: z
          .object({
            ticketId: z.string().uuid().describe('The UUID of the ticket to get metrics for'),
          })
          .strict(),
        func: async ({ ticketId }) => {
          try {
            Logger.info('Retrieving ticket metrics', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { ticketId },
            })

            // First verify the ticket exists and get its details
            const { data: ticket, error: ticketError } = await this.supabase
              .from('ticket')
              .select(
                `
                id,
                status,
                priority,
                created_at,
                updated_at,
                ticket_history (
                  created_at,
                  status_changed_to
                ),
                interaction (
                  created_at
                )
              `
              )
              .eq('id', ticketId)
              .single()

            if (ticketError || !ticket) {
              Logger.error('Ticket not found', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: { ticketId },
              })
              return JSON.stringify({
                error: 'Failed to get ticket metrics',
                details: 'Ticket not found',
              })
            }

            // Calculate metrics
            const createdAt = new Date(ticket.created_at)
            const updatedAt = new Date(ticket.updated_at)
            const now = new Date()

            // Sort history by date
            const history = (ticket.ticket_history || []).sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )

            // Calculate time to first response
            const interactions = (ticket.interaction || []).sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            const firstResponse = interactions[0]
            const timeToFirstResponse = firstResponse
              ? new Date(firstResponse.created_at).getTime() - createdAt.getTime()
              : null

            // Calculate resolution time if resolved
            const resolvedStatus = history.find((h) => h.status_changed_to === 'resolved')
            const resolutionTime = resolvedStatus
              ? new Date(resolvedStatus.created_at).getTime() - createdAt.getTime()
              : null

            // Calculate total time in each status
            const statusDurations: Record<string, number> = {}
            let lastStatusChange = createdAt
            let currentStatus = 'open'

            history.forEach((change) => {
              const changeDate = new Date(change.created_at)
              const duration = changeDate.getTime() - lastStatusChange.getTime()

              statusDurations[currentStatus] = (statusDurations[currentStatus] || 0) + duration

              currentStatus = change.status_changed_to
              lastStatusChange = changeDate
            })

            // Add time in current status
            const currentDuration = now.getTime() - lastStatusChange.getTime()
            statusDurations[currentStatus] = (statusDurations[currentStatus] || 0) + currentDuration

            // Format durations to hours
            const formatDuration = (ms: number) => Math.round((ms / (1000 * 60 * 60)) * 10) / 10

            const statusDurationMap = Object.entries(statusDurations).reduce(
              (acc, [status, duration]) => ({
                ...acc,
                [status]: formatDuration(duration),
              }),
              {} as Record<string, number>
            )

            const metrics = {
              currentStatus: ticket.status,
              priority: ticket.priority,
              age: formatDuration(now.getTime() - createdAt.getTime()),
              timeToFirstResponse: timeToFirstResponse ? formatDuration(timeToFirstResponse) : null,
              resolutionTime: resolutionTime ? formatDuration(resolutionTime) : null,
              totalUpdates: history.length,
              totalInteractions: interactions.length,
              statusDurations: statusDurationMap,
              lastUpdated: formatDuration(now.getTime() - updatedAt.getTime()),
            }

            return JSON.stringify({
              success: true,
              metrics,
              message: 'Ticket metrics retrieved successfully',
            })
          } catch (error) {
            Logger.error('Error retrieving ticket metrics', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to get ticket metrics',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
      new DynamicStructuredTool({
        name: 'suggestTags',
        description: 'Suggests relevant tags for a ticket based on its content',
        schema: z
          .object({
            ticketId: z.string().uuid().describe('The UUID of the ticket to suggest tags for'),
            maxTags: z
              .number()
              .min(1)
              .max(10)
              .optional()
              .default(5)
              .describe('Maximum number of tags to suggest'),
          })
          .strict(),
        func: async ({ ticketId, maxTags = 5 }) => {
          try {
            Logger.info('Suggesting tags for ticket', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { ticketId, maxTags },
            })

            // First get the ticket content
            const { data: ticket, error: ticketError } = await this.supabase
              .from('ticket')
              .select('id, title, description')
              .eq('id', ticketId)
              .single()

            if (ticketError || !ticket) {
              Logger.error('Ticket not found', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: { ticketId },
              })
              return JSON.stringify({
                error: 'Failed to suggest tags',
                details: 'Ticket not found',
              })
            }

            // Get existing tags for reference
            const { data: existingTags, error: tagsError } = await this.supabase
              .from('tag')
              .select('name, description')

            if (tagsError) {
              Logger.error('Error fetching existing tags', {
                category: 'Action',
                sessionId: this.sessionId,
                metadata: {
                  error:
                    tagsError instanceof PostgrestError
                      ? {
                          code: tagsError.code,
                          message: tagsError.message,
                          details: tagsError.details,
                          hint: tagsError.hint,
                        }
                      : String(tagsError),
                },
              })
              return JSON.stringify({
                error: 'Failed to suggest tags',
                details: tagsError instanceof PostgrestError ? tagsError.message : 'Database error',
              })
            }

            // Use OpenAI to suggest tags
            const response = await this.model.invoke([
              [
                'system',
                `You are a ticket tagging system. Analyze the ticket content and suggest relevant tags.
              
              Existing tags: ${existingTags?.map((t) => t.name).join(', ') || 'None'}
              
              Rules:
              - Suggest up to ${maxTags} tags
              - Use existing tags when relevant
              - Suggest new tags if needed
              - Tags should be lowercase, use hyphens for spaces
              - Tags should be specific and meaningful
              - Respond with a JSON array of strings
              
              Example response: ["bug", "frontend", "high-priority", "customer-reported", "needs-investigation"]`,
              ],
              ['user', `Title: ${ticket.title}\nDescription: ${ticket.description}`],
            ])

            let suggestedTags: string[]
            try {
              suggestedTags = JSON.parse(String(response.content))
              if (
                !Array.isArray(suggestedTags) ||
                !suggestedTags.every((t) => typeof t === 'string')
              ) {
                throw new Error('Invalid tags format')
              }
            } catch (e) {
              throw new Error('Failed to parse suggested tags')
            }

            // Limit to maxTags
            suggestedTags = suggestedTags.slice(0, maxTags)

            Logger.info('Tags suggested successfully', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { ticketId, suggestedTags },
            })

            return JSON.stringify({
              success: true,
              tags: suggestedTags,
              message: 'Tags suggested successfully',
              existingTags: existingTags?.map((t) => t.name) || [],
            })
          } catch (error) {
            Logger.error('Error suggesting tags', {
              category: 'Action',
              sessionId: this.sessionId,
              metadata: { error: errorToJson(error) },
            })
            return JSON.stringify({
              error: 'Failed to suggest tags',
              details: error instanceof Error ? error.message : 'Unknown error occurred',
            })
          }
        },
      }),
    ]

    // Create the agent with tracing enabled
    const agent = await createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt,
    })

    // Create the executor with tracing
    return AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      verbose: false,
      tags: ['autocrm'],
      metadata: {
        sessionId: this.sessionId,
        ...(typeof this.metadata === 'object' ? this.metadata : {}),
      },
    })
  }

  private async loadHistory(): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return messages.map((msg) => ({
        id: msg.id,
        sessionId: msg.session_id,
        role: msg.message_type,
        content: msg.content,
        metadata: msg.metadata as Json,
        createdAt: new Date(msg.created_at),
      }))
    } catch (error) {
      Logger.error('Failed to load history', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { error: errorToJson(error) },
      })
    return []
    }
  }

  private async getRelevantContext(query: string): Promise<string[]> {
    try {
      const results = await this.vectorStore.similaritySearch(query, 3)
      return results.map((doc) => doc.pageContent)
    } catch (error) {
      Logger.error('Error getting relevant context', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { error: errorToJson(error) },
      })
      return []
    }
  }

  async processMessage(message: string): Promise<string> {
    try {
      if (!this.agent) {
        throw new Error('Agent not initialized')
      }

      // Get chat history
      const messages = this.memory.getMessages()
      const chatHistory = messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')

      // Add user message to memory first
      await this.memory.addMessage({
        id: uuidv4(),
        sessionId: this.sessionId,
        role: 'user',
        content: message,
        metadata: {},
        createdAt: new Date(),
      })

      // Use the agent executor to process the message with chat history and tracing
      const response = await this.agent.invoke({
        input: message,
        chat_history: chatHistory,
        metadata: {
          sessionId: this.sessionId,
          messageCount: messages.length,
        },
        tags: ['message_processing'],
      })
      const responseContent = response.output as string

      // Add AI response to memory
      await this.memory.addMessage({
        id: uuidv4(),
        sessionId: this.sessionId,
        role: 'assistant',
        content: responseContent,
        metadata: {},
        createdAt: new Date(),
      })

      return responseContent
    } catch (error) {
      Logger.error('Failed to process message', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }

  private async queryTickets(
    timeframe?: string,
    status?: NonNullable<Database['public']['Tables']['ticket']['Row']['status']>
  ) {
    try {
      Logger.info('Querying tickets', {
        category: 'Action',
        sessionId: this.sessionId,
        metadata: { timeframe, status },
      })

      type UserFields = Pick<Database['public']['Tables']['user']['Row'], 'id' | 'email' | 'name'>
      type TicketWithUsers = Database['public']['Tables']['ticket']['Row'] & {
        creator: UserFields | null
        assignee: UserFields | null
      }

      // Build the query using the same format as TicketList.tsx
      const query = this.supabase.from('ticket').select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          created_by,
          assigned_to,
          creator:user!tickets_created_by_fkey (
            id,
            email,
            name
          ),
          assignee:user!tickets_assigned_to_fkey (
            id,
            email,
            name
          )
        `)

      if (timeframe === 'latest') {
        query.limit(1)
      } else {
        query.limit(10)
      }

      if (status) {
        query.eq('status', status)
      }

      query.order('created_at', { ascending: false })

      const { data: tickets, error } = (await query) as {
        data: TicketWithUsers[] | null
        error: PostgrestError | null
      }

      if (error) {
        Logger.error('Error querying tickets', {
          category: 'Action',
          sessionId: this.sessionId,
          metadata: {
            error:
              error instanceof PostgrestError
                ? {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                  }
                : String(error),
          },
        })
        throw error
      }

      // Format the response to be more descriptive
      const formattedData = (tickets || []).map((ticket) => {
        return {
          id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          description: ticket.description,
          createdAt: ticket.created_at,
          assignedTo: ticket.assignee?.name || 'Unassigned',
          createdBy: ticket.creator?.name || 'Unknown',
        }
      })

      return formattedData
    } catch (error) {
      Logger.error('Error querying tickets', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: {
          error:
            error instanceof PostgrestError
              ? {
                  code: error.code,
                  message: error.message,
                  details: error.details,
                  hint: error.hint,
                }
              : String(error),
        },
      })
      throw error
    }
  }

  async loadContext() {
    try {
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      this.context = messages.map((msg) => ({
        role: msg.message_type,
        content: msg.content,
      }))

      Logger.debug('Loaded context', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { messageCount: messages.length } as Json,
      })
    } catch (error) {
      Logger.error('Failed to load context', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { error: errorToJson(error) } as Json,
      })
      throw error
    }
  }

  async createSession() {
    try {
      const metadata = this.metadata as { userId: string }
      if (!metadata.userId) {
        throw new Error('User ID is required to create a session')
      }

      const { data: session, error } = await this.supabase
        .from('chat_sessions')
        .insert({
            metadata: this.metadata,
          status: 'active' as const,
          title: 'New Chat Session',
          created_by: metadata.userId,
        })
        .select()
        .single()

      if (error) throw error

      Logger.info('Created new session', {
        category: 'Chat',
        sessionId: session.id,
        metadata: this.metadata,
      })

      return session
    } catch (error) {
      Logger.error('Failed to create session', {
        category: 'Chat',
        metadata: { error: errorToJson(error) } as Json,
      })
      throw error
    }
  }

  private async updateTicket(
    ticketId: string,
    updates: {
      status?: NonNullable<Database['public']['Tables']['ticket']['Row']['status']>
      priority?: NonNullable<Database['public']['Tables']['ticket']['Row']['priority']>
    }
  ) {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .update({
          status: updates.status,
          priority: updates.priority,
        })
        .eq('id', ticketId)
        .select()
        .single()

      if (error) throw error

      Logger.info('Updated ticket', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { ticketId, updates },
      })

      return data
    } catch (error) {
      Logger.error('Failed to update ticket', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }

  private async createTicket(
    title: string,
    description: string,
    priority: NonNullable<Database['public']['Tables']['ticket']['Row']['priority']>
  ) {
    try {
      const metadata = this.metadata as { userId: string }
      if (!metadata.userId) {
        throw new Error('User ID is required to create a ticket')
      }

      const { data, error } = await this.supabase
        .from('ticket')
        .insert({
          title,
          description,
          status: 'open' as const,
          priority,
          created_by: metadata.userId,
        })
        .select()
        .single()

      if (error) throw error

      Logger.info('Created ticket', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { ticketId: data.id },
      })

      // Update chat session with ticket ID
      await this.chatService.updateSession(this.sessionId, {
        ticketId: data.id,
        metadata: this.metadata,
      })

      return data
    } catch (error) {
      Logger.error('Failed to create ticket', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }

  async updateChatSession(updates: UpdateChatSessionParams) {
    try {
      const { error } = await this.supabase
        .from('chat_sessions')
        .update({
          status: updates.status,
          title: updates.title,
          metadata: updates.metadata,
          ticket_id: updates.ticketId,
        })
        .eq('id', this.sessionId)

      if (error) throw error

      Logger.info('Updated chat session', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { updates: updates as unknown as Json },
      })

      return updates
    } catch (error) {
      Logger.error('Failed to update chat session', {
        category: 'AI',
        sessionId: this.sessionId,
        metadata: { error: errorToJson(error) },
      })
      throw error
    }
  }
}
