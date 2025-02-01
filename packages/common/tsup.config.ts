import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'antd',
    '@ant-design/icons',
    '@supabase/auth-helpers-nextjs',
    '@supabase/auth-helpers-react',
    '@supabase/supabase-js',
    '@ant-design/cssinjs',
    'next',
    'next/navigation',
    'next/server',
    'crypto',
  ],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  platform: 'browser',
  target: 'es2020',
  esbuildOptions(options) {
    options.conditions = ['module']
    options.define = {
      'process.env.NODE_ENV': '"development"',
    }
    options.mainFields = ['module', 'main']
  },
})
