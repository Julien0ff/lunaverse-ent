import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './themes.css'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { NotificationProvider } from '@/context/NotificationContext'
import AppShell from '@/components/AppShell'
import ThemeApplier from '@/components/ThemeApplier'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ENT LunaVerse',
  description: 'ENT pour le serveur RP LunaVerse. Retrouvez vos informations, cours, absences, cantine et plus.',
  keywords: ['LunaVerse', 'ENT', 'RP', 'Serveur', 'Ecole', 'Education'],
  authors: [{ name: 'LunaVerse' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    url: 'https://ent.lunaverse.fr/',
    title: 'ENT LunaVerse',
    description: 'Espace Numérique de Travail pour le serveur RP LunaVerse.',
    siteName: 'ENT LunaVerse',
    images: [{ url: '/logo.png' }]
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png'
  },
  manifest: '/manifest.json',
  themeColor: '#5865F2',
  appleWebApp: {
    title: 'LunaVerse',
    statusBarStyle: 'default',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
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
              </AppShell>
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
