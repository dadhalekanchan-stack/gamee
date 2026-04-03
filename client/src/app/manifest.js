export default function manifest() {
  return {
    name: 'Academia 2D RPG',
    short_name: 'Academia',
    id: '/',
    description: 'Tile-based educational RPG',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#050b1c',
    theme_color: '#10244f',
    orientation: 'any',
    icons: [
      {
        src: '/icons/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
