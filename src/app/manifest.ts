import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LessonCaptain',
    short_name: 'LessonCaptain',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4DA3FF',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
