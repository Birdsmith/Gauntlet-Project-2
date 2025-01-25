import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: [
    'react',
    'antd',
    '@ant-design/icons',
    '@supabase/auth-helpers-nextjs',
    '@ant-design/cssinjs',
    'next/navigation',
    'next/server',
  ],
  treeshake: true,
})
