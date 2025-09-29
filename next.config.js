/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Désactiver le SSR pour éviter les erreurs de context
  experimental: {
    appDir: false
  }
}

module.exports = nextConfig