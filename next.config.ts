import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is the default builder in Next 16. Do NOT add a custom webpack
  // config here — it makes `next build` fail.
  async redirects() {
    return [{ source: '/', destination: '/en', permanent: false }]
  },
}

export default nextConfig
