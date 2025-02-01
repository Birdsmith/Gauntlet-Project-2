import { ChatService } from '../services/chat.service'
import { ChatMessage } from '../types/chat.types'

export class ConversationMemory {
  private messages: ChatMessage[] = []

  constructor(
    private chatService: ChatService,
    private sessionId: string
  ) {}

  async loadMessages(): Promise<void> {
    this.messages = await this.chatService.getMessages(this.sessionId)
  }

  async addMessage(message: ChatMessage): Promise<void> {
    const savedMessage = await this.chatService.addMessage(message)
    this.messages.push(savedMessage)
  }

  getMessages(): ChatMessage[] {
    return this.messages
  }

  clear(): void {
    this.messages = []
  }
}
