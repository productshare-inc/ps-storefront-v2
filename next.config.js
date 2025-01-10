/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
    trailingSlash: false,
    pageExtensions: ['page.tsx', 'page.ts', 'ts', 'tsx'],
    swcMinify: true,
    reactStrictMode: false,
    async headers() {
        const headers = [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    },
                ],
            },
        ];

        if (isProduction) {
            headers[0].headers.push({
                key: 'Content-Security-Policy',
                value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.privy.io https://cdn.privy.io https://*.twitter.com https://x.com",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: https: blob: https://*.twitter.com https://x.com https://*.productshare.co https://*.tokenshare.xyz https://*.productshare.net",
                    "font-src 'self' data: https:",
                    "connect-src 'self' https://api.privy.io https://api.openai.com https://*.twitter.com https://api.twitter.com https://x.com wss: https: https://*.productshare.co https://*.tokenshare.xyz https://*.productshare.net",
                    "frame-ancestors 'self' https://*.productshare.co https://*.tokenshare.xyz https://*.productshare.net",
                    "frame-src 'self' https://api.privy.io https://cdn.privy.io https://*.twitter.com https://x.com https://*.productshare.co https://*.tokenshare.xyz https://*.productshare.net",
                    "media-src 'self' https: data: blob:",
                    "worker-src 'self' blob:",
                    "manifest-src 'self'",
                ].join('; '),
            });
        }

        return headers;
    },
};

module.exports = nextConfig;
