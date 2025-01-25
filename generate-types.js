const { execSync } = require('child_process')
const path = require('path')

try {
  console.log('🔄 Generating Supabase types...')

  execSync(
    'supabase gen types typescript --project-id "qkljxtvrmjsabdqxixyf" --schema public > packages/common/src/lib/types/database.types.ts',
    { stdio: 'inherit' }
  )

  console.log('✅ Types generated successfully!')
} catch (error) {
  console.error('❌ Error generating types:', error.message)
  process.exit(1)
}
