import type { Metadata } from 'next'
import { Playfair_Display, Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
})
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' })

export const metadata: Metadata = {
  title: 'Elite X Shop - Shop With Class',
  description: 'Elite X Shop offers a refined mix of premium sex toys, clothing, shoes, accessories, and intimate essentials with discreet delivery and transparent pricing in naira.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Elite X Shop',
  themeColor: '#040a1c',
  appleWebApp: {
    capable: true,
    title: 'Elite X Shop',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/dam.png', type: 'image/png' },
      { url: '/dam.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/dam.png', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning className={playfair.variable + ' ' + inter.variable + ' ' + spaceGrotesk.variable + ' dark'}>
      <body className='min-h-screen bg-obsidian font-body antialiased text-ivory'>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

