import { Press_Start_2P } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] })

export const metadata = {
  title: 'Academia 2D RPG',
  description: 'Tile-based educational RPG',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Academia',
  },
}

export const viewport = {
  themeColor: '#10244f',
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
