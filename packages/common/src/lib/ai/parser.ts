import { z } from 'zod'
import { StructuredOutputParser } from '@langchain/core/output_parsers'

// Define the schema for parsed CRM operations
export const crmOutputSchema = z.object({
  intent: z.enum([
    'query_tickets', // Search or list tickets
    'update_ticket', // Modify ticket fields
    'add_comment', // Add comment to ticket
    'create_interaction', // Log customer interaction
    'clarify', // Need more information
    'unknown', // Cannot determine intent
  ]),
  confidence: z.number().min(0).max(1),
  entities: z
    .object({
      ticketId: z.string().uuid().optional(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      assignedTo: z.string().uuid().optional(),
      content: z.string().optional(),
      type: z.enum(['email', 'phone', 'chat', 'sms']).optional(),
      createdAt: z.string().optional(), // Date string for created_at filter
      updatedAt: z.string().optional(), // Date string for updated_at filter
      timeframe: z
        .enum(['today', 'yesterday', 'last_week', 'last_month', 'custom', 'latest'])
        .optional(),
      userId: z.string().uuid().optional(), // For filtering by creator
      searchQuery: z.string().optional(), // For text search
    })
    .optional(),
  action: z
    .object({
      type: z.enum(['query', 'update', 'create', 'delete']),
      table: z.enum(['ticket', 'comment', 'interaction']),
      changes: z.record(z.any()).nullable().optional(),
      filters: z
        .object({
          dateRange: z
            .object({
              start: z.string().optional(),
              end: z.string().optional(),
            })
            .optional(),
          creator: z.string().uuid().optional(),
          searchText: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  context: z.object({
    requiresConfirmation: z.boolean(),
    missingInformation: z.array(z.string()).optional(),
    suggestedQuestions: z.array(z.string()).optional(),
    hasTemporalContext: z.boolean().optional(), // Indicates if time/date info is present
    hasSufficientContext: z.boolean().optional(), // Indicates if we can proceed with query
  }),
})

export type CRMOutput = z.infer<typeof crmOutputSchema>

// Create a parser that enforces this schema
export const outputParser = StructuredOutputParser.fromZodSchema(crmOutputSchema)

// Format instructions for the LLM
export const FORMAT_INSTRUCTIONS = `You must respond in a JSON format that matches the following schema:

{{
  "intent": "query_tickets" | "update_ticket" | "add_comment" | "create_interaction" | "clarify" | "unknown",
  "confidence": number between 0 and 1,
  "entities": {{
    "ticketId": "uuid string (optional)",
    "status": "open" | "in_progress" | "resolved" | "closed" (optional)",
    "priority": "low" | "medium" | "high" | "urgent" (optional)",
    "assignedTo": "uuid string (optional)",
    "content": "string (optional)",
    "type": "email" | "phone" | "chat" | "sms" (optional)",
    "createdAt": "date string (optional)",
    "updatedAt": "date string (optional)",
    "timeframe": "today" | "yesterday" | "last_week" | "last_month" | "custom" | "latest" (optional),
    "userId": "uuid string (optional)",
    "searchQuery": "string (optional)"
  }},
  "action": {{
    "type": "query" | "update" | "create" | "delete",
    "table": "ticket" | "comment" | "interaction",
    "changes": object or null (optional),
    "filters": {{
      "dateRange": {{
        "start": "date string (optional)",
        "end": "date string (optional)"
      }},
      "creator": "uuid string (optional)",
      "searchText": "string (optional)"
    }}
  }},
  "context": {{
    "requiresConfirmation": boolean,
    "missingInformation": ["string array of missing info (optional)"],
    "suggestedQuestions": ["string array of follow-up questions (optional)"],
    "hasTemporalContext": boolean (optional),
    "hasSufficientContext": boolean (optional)
  }}
}}`
