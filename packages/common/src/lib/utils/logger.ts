import { Json } from '../types/chat.types'

type LogLevel = 'info' | 'debug' | 'warn' | 'error'
type LogCategory = 'AI' | 'Chat' | 'Intent' | 'Context' | 'Action'

interface LogOptions {
  category: LogCategory
  sessionId?: string
  metadata?: Json
}

export class Logger {
  static log(level: LogLevel, message: string, options: LogOptions) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${options.category}]${options.sessionId ? ` [Session: ${options.sessionId}]` : ''}`

    const logMessage = `${prefix} ${message}`
    const logData = options.metadata
      ? `\nMetadata: ${JSON.stringify(options.metadata, null, 2)}`
      : ''

    switch (level) {
      case 'info':
        console.log('\x1b[36m%s\x1b[0m', logMessage, logData) // Cyan
        break
      case 'debug':
        console.log('\x1b[90m%s\x1b[0m', logMessage, logData) // Gray
        break
      case 'warn':
        console.log('\x1b[33m%s\x1b[0m', logMessage, logData) // Yellow
        break
      case 'error':
        console.log('\x1b[31m%s\x1b[0m', logMessage, logData) // Red
        break
    }
  }

  static info(message: string, options: LogOptions) {
    this.log('info', message, options)
  }

  static debug(message: string, options: LogOptions) {
    this.log('debug', message, options)
  }

  static warn(message: string, options: LogOptions) {
    this.log('warn', message, options)
  }

  static error(message: string, options: LogOptions) {
    this.log('error', message, options)
  }
}
