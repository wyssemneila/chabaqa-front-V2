import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')
const isDevelopment = process.env.NODE_ENV === 'development'
const apiOrigin = String(process.env.NEXT_PUBLIC_API_URL || process.env.API_INTERNAL_URL || 'http://localhost:3000/api')
  .replace(/\/api\/?$/, '')
const scriptSrcDirective = [
  "script-src 'self' 'unsafe-inline'",
  isDevelopment ? "'unsafe-eval'" : '',
  'blob:',
].filter(Boolean).join(' ')
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  [
    "img-src 'self' data: blob:",
    'https://api.chabaqa.io',
    'http://51.254.132.77:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://picsum.photos',
    'https://ui-avatars.com',
    'https://placehold.co',
    'https://images.unsplash.com',
  ].join(' '),
  "font-src 'self' data:",
  scriptSrcDirective,
  "style-src 'self' 'unsafe-inline'",
  [
    "connect-src 'self'",
    apiOrigin,
    'https://api.chabaqa.io',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3100',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3100',
    'ws://localhost:8080',
    'ws://localhost:8082',
    'ws://127.0.0.1:8080',
    'ws://127.0.0.1:8082',
    'ws://192.168.56.1:8082',
  ].join(' '),
  [
    "media-src 'self' data: blob:",
    'https://api.chabaqa.io',
    'http://51.254.132.77:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ].join(' '),
  "worker-src 'self' blob:",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep next dev artifacts separate from production builds so a local
  // `next build` cannot invalidate the running dev server's chunk manifest.
  distDir: isDevelopment ? '.next-dev' : '.next',
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    cpus: 1,
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.chabaqa.io',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '51.254.132.77',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '51.254.132.77',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Google OAuth callback popup must postMessage back to the opener.
        // COOP unsafe-none prevents Chrome from severing window.opener
        // after the cross-origin Google redirect.
        source: '/api/auth/google/callback',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
      {
        // Cache proxied uploads (images, documents, audio) at the browser
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
  async rewrites() {
    // Choose a backend origin that works both on host and inside Docker containers.
    // Prefer API_INTERNAL_URL (set in docker-compose for container-to-container calls),
    // fallback to NEXT_PUBLIC_API_URL (browser-facing), then localhost.
    const apiInternal = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    // Ensure we have only the origin (strip any trailing /api)
    const backendOrigin = String(apiInternal).replace(/\/api\/?$/, '');

    return [
      {
        // Proxy non-video uploads to backend (images, documents, audio)
        source: '/uploads/image/:path*',
        destination: `${backendOrigin}/uploads/image/:path*`,
      },
      {
        source: '/uploads/document/:path*',
        destination: `${backendOrigin}/uploads/document/:path*`,
      },
      {
        source: '/uploads/audio/:path*',
        destination: `${backendOrigin}/uploads/audio/:path*`,
      },
      {
        // Video files are NOT proxied — they go through /api/video/stream/:sessionId
        // This prevents direct video URL exposure through the frontend domain
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`, // Proxy API requests to Backend
      },
    ];
  },
}

export default withNextIntl(nextConfig)
