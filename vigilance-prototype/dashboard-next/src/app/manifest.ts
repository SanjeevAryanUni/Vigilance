import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VIGILANCE - Urban Road Intelligence',
    short_name: 'Vigilance',
    description: 'AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet',
    start_url: '/capture',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0284c7',
    orientation: 'portrait',
    categories: ['utilities', 'navigation'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
