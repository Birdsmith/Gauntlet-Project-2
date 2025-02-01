import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { Client } from 'langsmith'
import { type Runnable } from '@langchain/core/runnables'
import { outputParser, FORMAT_INSTRUCTIONS } from './parser'
import { Logger } from '../utils/logger'
import { errorToJson } from './agent'

// Define example conversations for each intent
const EXAMPLES = `Here are some example user requests and their intents:

Query Tickets:
- "Show me all open tickets"
- "Find high priority tickets assigned to John"
- "Search for tickets about login issues"
- "What tickets did I create yesterday?" (use timeframe: "yesterday")
- "Show me tickets from January 24th" (use dateRange in filters)
- "Find my last created ticket" (use timeframe: "latest")
- "Give me info on my most recent ticket" (use timeframe: "latest")
Intent: query_tickets

Update Ticket:
- "Change ticket #123 status to in progress"
- "Set the priority of ticket ABC to high"
- "Assign ticket XYZ to Sarah"
Intent: update_ticket

Add Comment:
- "Add a note to ticket #456: Customer called about the issue"
- "Comment on ABC-123: Will be fixed in next release"
- "Leave an internal note on ticket XYZ"
Intent: add_comment

Create Interaction:
- "Log a phone call for ticket #789"
- "Record an email interaction for ABC-123"
- "Add a chat interaction to ticket XYZ"
Intent: create_interaction

Unclear/Need Clarification:
- "What's the status?" (no context about which ticket)
- "Update it" (no context about what to update)
- "Change the ticket" (no context about changes needed)
Intent: clarify

Note: When user asks for their "last" or "most recent" ticket, use query_tickets intent with timeframe: "latest". For specific dates, use dateRange in filters. Only use clarify if truly ambiguous.`

export class IntentClassifier {
  private model: ChatOpenAI
  private prompt: PromptTemplate
  private stringParser: StringOutputParser
  private chain: Runnable
  private langsmith: Client

  constructor() {
    // Initialize the classifier with GPT-4
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      Logger.error('OpenAI API key not found', {
        category: 'AI',
        metadata: {
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        },
      })
      throw new Error('OpenAI API key not found in environment variables')
    }

    Logger.info('Initializing IntentClassifier', {
      category: 'AI',
      metadata: {
        keyExists: !!apiKey,
        keyPrefix: apiKey.slice(0, 5),
      },
    })

    // Initialize LangSmith client
    this.langsmith = new Client()

    this.model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0,
      apiKey: apiKey,
    })

    this.prompt = PromptTemplate.fromTemplate(
      'You are an AI assistant that helps classify user requests related to CRM operations.\n\n' +
        'Your task is to:\n' +
        "1. Identify the user's intent\n" +
        '2. Extract relevant entities and temporal information\n' +
        '3. Determine the required action\n' +
        '4. Assess if more information is needed\n\n' +
        'Important Guidelines:\n' +
        '1. NEVER make automatic queries or take actions without explicit user requests\n' +
        '2. If user provides a date, time, or mentions "last" or "recent", use query_tickets with those filters\n' +
        '3. Only use clarify intent when truly ambiguous\n' +
        '4. Maintain context from previous messages\n' +
        '5. Wait for explicit user requests before suggesting actions\n\n' +
        FORMAT_INSTRUCTIONS +
        '\n\n' +
        'Examples of different intents:\n' +
        EXAMPLES +
        '\n\n' +
        'Current conversation context:\n{context}\n\n' +
        'User message: {input}\n\n' +
        'Classify this request according to the schema above. If you\'re unsure or need more information, use the "clarify" intent and suggest follow-up questions.\n\n' +
        'IMPORTANT: Return only the JSON object without any markdown code blocks or other formatting.\n' +
        'Do not include any additional text before or after the JSON object.'
    )

    this.stringParser = new StringOutputParser()

    // Create a chain with LangSmith tracing
    this.chain = this.prompt
      .pipe(this.model)
      .pipe(this.stringParser)
      .withConfig({
        tags: ['intent_classification'],
      })
  }

  async classifyIntent(message: string, context: string = '') {
    Logger.info('Classifying intent', {
      category: 'AI',
      metadata: {
        message,
        contextLength: context.length,
      },
    })

    try {
      // Use the chain with tracing
      const response = await this.chain.invoke(
        {
          input: message,
          context,
        },
        {
          configurable: {
            metadata: {
              messageLength: message.length,
              contextLength: context.length,
            },
          },
        }
      )

      Logger.debug('Raw classification response', {
        category: 'AI',
        metadata: {
          response,
        },
      })

      // Clean the response by removing any markdown code blocks
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()

      const parsed = await outputParser.parse(cleanedResponse)

      Logger.info('Intent classified', {
        category: 'AI',
        metadata: {
          classification: parsed,
        },
      })

      return parsed
    } catch (error) {
      Logger.error('Failed to classify intent', {
        category: 'AI',
        metadata: {
          error: errorToJson(error),
          message: 'Error classifying intent',
          context: message,
        },
      })
      throw error
    }
  }
}
