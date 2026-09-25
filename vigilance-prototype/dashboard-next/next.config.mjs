import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: { disableDevLogs: true },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['maplibre-gl'],
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/reports/:path*',
        destination: 'http://localhost:8000/api/reports/:path*',
      },
      {
        source: '/api/cities/:path*',
        destination: 'http://localhost:8000/api/cities/:path*',
      },
      {
        source: '/api/cities',
        destination: 'http://localhost:8000/api/cities',
      },
    ];
  },
};

export default withPWA(nextConfig);
