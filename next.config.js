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