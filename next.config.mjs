import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')
const isDevelopment = process.env.NODE_ENV === 'development'
const apiOrigin = String(process.env.NEXT_PUBLIC_API_URL || process.env.API_INTERNAL_URL || 'http://localhost:3000/api')
  .replace(/\/api\/?$/, '')
const scriptSrcDirective = [
  "script-src 'self' 'unsafe-inline'",
  isDevelopment ? "'unsafe-eval'" : '',
  'blob:',
  'https://www.youtube.com',
  'https://s.ytimg.com',
].filter(Boolean).join(' ')
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  [
    "img-src 'self' data: blob:",
    'https://chabaqa.io',
    'https://www.chabaqa.io',
    'https://api.chabaqa.io',
    'https://interactive-examples.mdn.mozilla.net',
    'http://51.254.132.77:3000',
    'http://localhost:3000',
    'ws://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'ws://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://picsum.photos',
    'https://fastly.picsum.photos',
    'https://ui-avatars.com',
    'https://placehold.co',
    'https://images.unsplash.com',
    'https://img.youtube.com',
    'https://i.ytimg.com',
    'https://yt3.ggpht.com',
    'https://yt3.googleusercontent.com',
  ].join(' '),
  "font-src 'self' data:",
  scriptSrcDirective,
  "style-src 'self' 'unsafe-inline'",
  [
    "connect-src 'self'",
    apiOrigin,
    'https://chabaqa.io',
    'wss://chabaqa.io',
    'https://www.chabaqa.io',
    'wss://www.chabaqa.io',
    'https://api.chabaqa.io',
    'wss://api.chabaqa.io',
    'http://localhost:3000',
    'ws://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3100',
    'http://127.0.0.1:3000',
    'ws://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3100',
    'ws://localhost:8080',
    'ws://localhost:8082',
    'ws://127.0.0.1:8080',
    'ws://127.0.0.1:8082',
    'ws://192.168.56.1:8082',
    'https://*.ingest.sentry.io',
    'https://*.ingest.de.sentry.io',
  ].join(' '),
  [
    "frame-src 'self'",
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://youtube.com',
    'https://player.vimeo.com',
    'https://js.stripe.com',
    'https://hooks.stripe.com',
  ].join(' '),
  [
    "media-src 'self' data: blob:",
    'https://chabaqa.io',
    'https://www.chabaqa.io',
    'https://api.chabaqa.io',
    'https://interactive-examples.mdn.mozilla.net',
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
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'chabaqa.io',              pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'www.chabaqa.io',          pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'api.chabaqa.io',          pathname: '/uploads/**' },
      { protocol: 'http',  hostname: '51.254.132.77', port: '3000', pathname: '/uploads/**' },
      { protocol: 'http',  hostname: 'localhost', port: '3000', pathname: '/uploads/**' },
      { protocol: 'http',  hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      { protocol: 'http',  hostname: '127.0.0.1', port: '3000', pathname: '/uploads/**' },
      { protocol: 'http',  hostname: '127.0.0.1', port: '3001', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'yt3.googleusercontent.com' },
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
    const backendOrigin = String(apiInternal).replace(/\/api\/?$/, '');

    return [
      {
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
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
}

export default withNextIntl(nextConfig)
