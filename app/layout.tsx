import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://episodio.com.tr'),
  manifest: '/manifest.webmanifest',
  title: {
    default: 'Episodio | Dizi Takip ve Sosyal Ağ Platformu',
    template: '%s | Episodio',
  },
  description: 'Favori dizilerinizi takip edin, özel izleme listeleri oluşturun, arkadaşlarınızla mesajlaşın ve dizi severlerle sosyal bir ağda etkileşime geçin.',
  keywords: ['dizi takip', 'sosyal ağ', 'episodio', 'dizi takibi', 'dizi izleme listesi', 'dizi takvimi', 'dizi mesajlaşma', 'dizi sosyalleşme'],
  authors: [{ name: 'Episodio' }],
  creator: 'Episodio',
  publisher: 'Episodio',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Episodio',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://episodio.com.tr',
    title: 'Episodio | Dizi Takip ve Sosyal Ağ Platformu',
    description: 'Favori dizilerinizi takip edin, izleme listeleri oluşturun, arkadaşlarınızla sohbet edin ve dizi severlerle sosyal bir ağda buluşun.',
    siteName: 'Episodio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Episodio | Dizi Takip ve Sosyal Ağ Platformu',
    description: 'Favori dizilerinizi takip edin, izleme listeleri oluşturun, arkadaşlarınızla sohbet edin ve dizi severlerle sosyal bir ağda buluşun.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

import PushNotificationPrompt from '@/components/PushNotificationPrompt';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Be+Vietnam+Pro:wght@400;500;700;800;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0A0A0A] text-[#F4F6FA]" suppressHydrationWarning>
        {children}
        <PushNotificationPrompt />
      </body>
    </html>
  );
}
