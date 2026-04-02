/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['phaser'],
  webpack: (config) => {
    config.externals = config.externals || []
    return config
  },
}

module.exports = nextConfig
