/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: false
  },
  // Configuration pour Vercel
  trailingSlash: false,
  generateBuildId: () => 'build'
}

module.exports = nextConfig