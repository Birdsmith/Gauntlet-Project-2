/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracing: true,
  transpilePackages: ['@autocrm/common'],
  experimental: {
    externalDir: true,
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

module.exports = nextConfig
