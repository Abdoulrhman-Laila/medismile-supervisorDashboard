import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // مخرجات مستقلة لتشغيل node server.js داخل صورة Docker
  output: "standalone",
  // المجلد الأب فيه package-lock آخر، وبدونه Next يختار جذراً خاطئاً فيفشل تحميل الـ chunks
  outputFileTracingRoot: projectRoot,
  reactStrictMode: true,
  
  // إصلاح مشاكل تحميل الـ chunks
  webpack: (config, { isServer }) => {
    // إصلاح مشاكل تحميل الـ chunks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // إصلاح مشكلة favicon
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
