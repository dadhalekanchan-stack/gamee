export default function manifest() {
  return {
    name: 'Academia 2D RPG',
    short_name: 'Academia',
    description: 'Tile-based educational RPG',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050b1c',
    theme_color: '#10244f',
    orientation: 'landscape',
    icons: [
      {
        src: '/icons/pwa-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  }
}
