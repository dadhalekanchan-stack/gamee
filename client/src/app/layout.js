import { Press_Start_2P } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] })

export const metadata = {
  title: 'Academia 2D RPG',
  description: 'Tile-based educational RPG',
  manifest: '/manifest.webmanifest',
  themeColor: '#10244f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Academia',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={pressStart.className}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
