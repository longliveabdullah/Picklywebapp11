/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Windows + pnpm: stale webpack filesystem cache can reference chunk ids (e.g. ./6599.js)
   * that no longer exist after interrupted compiles. Disable dev cache to avoid ghost chunks.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

export default nextConfig
