import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './themes.css'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { NotificationProvider } from '@/context/NotificationContext'
import AppShell from '@/components/AppShell'
import RadioPlayer from '@/components/RadioPlayer'
import ThemeApplier from '@/components/ThemeApplier'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ENT LunaVerse',
  description: 'ENT pour le serveur RP LunaVerse',
  manifest: '/manifest.json',
  themeColor: '#5865F2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LunaVerse',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ThemeApplier />
        <AuthProvider>
          <LanguageProvider>
            <NotificationProvider>
              <AppShell>
                {children}
                <RadioPlayer />
              </AppShell>
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
