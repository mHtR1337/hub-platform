/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Next.js 16.2.x on Vercel: ensure @swc/helpers ESM files are traced.
  outputFileTracingIncludes: {
    "*": ["./node_modules/@swc/helpers/esm/**"],
  },
}

export default nextConfig
