import { Press_Start_2P } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] })

export const metadata = {
  title: 'Academia 2D RPG',
  description: 'Tile-based educational RPG',
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
