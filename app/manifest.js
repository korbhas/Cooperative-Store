export default function manifest() {
  return {
    name: 'TU Cooperative Store',
    short_name: 'TU Store',
    description: 'Fresh groceries delivered to your door',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A3663',
    theme_color: '#0A3663',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
