import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://episodio.com.tr'),
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: 'https://episodio.com.tr',
  },
  title: {
    default: 'Episodio | Dizi Takip ve Sosyal Ağ Platformu',
    template: '%s | Episodio',
  },
  description: 'Favori dizilerinizi takip edin, özel izleme listeleri oluşturun, arkadaşlarınızla mesajlaşın ve dizi severlerle sosyal bir ağda etkileşime geçin.',
  keywords: ['episodio', 'episodio dizi', 'dizi takip', 'sosyal ağ', 'dizi takibi', 'dizi izleme listesi', 'dizi takvimi', 'dizi mesajlaşma', 'dizi sosyalleşme'],
  authors: [{ name: 'Episodio' }],
  creator: 'Episodio',
  publisher: 'Episodio',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
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
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://episodio.com.tr/#website',
      'url': 'https://episodio.com.tr',
      'name': 'Episodio',
      'description': 'Dizi Takip ve Sosyal Ağ Platformu',
      'publisher': {
        '@id': 'https://episodio.com.tr/#organization'
      },
      'inLanguage': 'tr-TR'
    },
    {
      '@type': 'Organization',
      '@id': 'https://episodio.com.tr/#organization',
      'name': 'Episodio',
      'url': 'https://episodio.com.tr',
      'logo': 'https://episodio.com.tr/icon.png'
    }
  ]
};

import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import MobileSplashVideo from '@/components/MobileSplashVideo';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import SiteAnnouncementBanner from '@/components/SiteAnnouncementBanner';
import BannedUserModal from '@/components/BannedUserModal';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark" style={{ backgroundColor: '#000000' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/apple-splash.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <style dangerouslySetInnerHTML={{ __html: `html,body{background-color:#000000 !important;color-scheme:dark;}*{scrollbar-width:none !important;-ms-overflow-style:none !important;}::-webkit-scrollbar{display:none !important;width:0 !important;height:0 !important;background:transparent !important;}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Be+Vietnam+Pro:wght@400;500;700;800;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#000000] text-[#F4F6FA]" style={{ backgroundColor: '#000000' }} suppressHydrationWarning>
        <MobileSplashVideo />
        <SiteAnnouncementBanner />
        <BannedUserModal />
        {children}
        <PushNotificationPrompt />
        <CookieConsentBanner />
      </body>
    </html>
  );
}


