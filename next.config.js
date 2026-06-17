/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 't2.gstatic.com',
        port: '',
        pathname: '/**',
      },
      // CDN para emoji-picker-react
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unpkg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // Índices de sección → subruta por defecto
      {
        source: '/:businessId/ai/memory',
        has: [{ type: 'query', key: 'tab', value: 'settings' }],
        destination: '/:businessId/ai/memory/ajustes',
        permanent: false,
      },
      {
        source: '/:businessId/ai/memory',
        destination: '/:businessId/ai/memory/datos',
        permanent: false,
      },
      {
        source: '/:businessId/offerings',
        destination: '/:businessId/offerings/products',
        permanent: false,
      },
      {
        source: '/:businessId/offerings/productos',
        destination: '/:businessId/offerings/products',
        permanent: false,
      },
      {
        source: '/:businessId/offerings/productos/:path*',
        destination: '/:businessId/offerings/products/:path*',
        permanent: false,
      },
      {
        source: '/:businessId/offerings/servicios',
        destination: '/:businessId/offerings/services',
        permanent: false,
      },
      {
        source: '/:businessId/offerings/servicios/:path*',
        destination: '/:businessId/offerings/services/:path*',
        permanent: false,
      },
      {
        source: '/:businessId/offerings/atributos',
        destination: '/:businessId/offerings/attributes',
        permanent: false,
      },
      {
        source: '/:businessId/catalog',
        destination: '/:businessId/offerings/products',
        permanent: false,
      },
      {
        source: '/:businessId/catalog/:path*',
        destination: '/:businessId/offerings/:path*',
        permanent: false,
      },
      {
        source: '/:businessId/billing',
        destination: '/:businessId/billing/facturas',
        permanent: false,
      },
      {
        source: '/:businessId/knowledge',
        destination: '/:businessId/knowledge/protocols',
        permanent: false,
      },
      {
        source: '/:businessId/ops',
        destination: '/:businessId/ops/logs',
        permanent: false,
      },
    ];
  },
  // Headers de cache para assets de emoji-picker-react y otros CDNs
  async headers() {
    return [
      {
        // Cachear assets estáticos de node_modules (incluyendo emoji-picker-react)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cachear assets de CDNs externos (emoji-picker-react usa CDN)
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        // Solo aplicar a requests que vengan de CDNs conocidos
        has: [
          {
            type: 'header',
            key: 'referer',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Configuración para manejar mejor los errores de webpack
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Configuración para módulos de cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },
  serverExternalPackages: ['firebase'],
  outputFileTracingRoot: require('path').join(__dirname),
}

module.exports = nextConfig 