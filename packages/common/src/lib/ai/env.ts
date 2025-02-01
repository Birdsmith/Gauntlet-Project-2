import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load environment variables from various possible locations
const possiblePaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(__dirname, '../../../../../.env.local'),
  resolve(process.cwd(), '../../.env.local'),
]

let loaded = false
if (typeof window === 'undefined') {
  // Only try to load from file on server-side
  for (const envPath of possiblePaths) {
    const result = config({ path: envPath })
    if (!result.error) {
      loaded = true
      console.log('Successfully loaded environment from:', envPath)
      break
    }
  }

  if (!loaded) {
    console.warn('Could not load .env.local file, falling back to process.env')
  }
}

// Check required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

// Log environment variable status without exposing values
for (const envVar of requiredEnvVars) {
  const exists = !!process.env[envVar]
  console.log(`${envVar} exists: ${exists}`)
}

export const getEnvVar = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Helper function to check if running on server
export const isServer = typeof window === 'undefined'

// Helper function to safely get environment variables
export const getEnvVarSafe = (name: string): string | undefined => {
  return process.env[name]
}

// Export commonly used environment variables
export const OPENAI_API_KEY = getEnvVarSafe('OPENAI_API_KEY')
export const SUPABASE_URL = getEnvVarSafe('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_SERVICE_ROLE_KEY = getEnvVarSafe('SUPABASE_SERVICE_ROLE_KEY')
