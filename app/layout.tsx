import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://episodio.com.tr'),
  title: {
    default: 'Episodio | Dizi ve Film Takip Platformu',
    template: '%s | Episodio',
  },
  description: 'Favori dizi ve filmlerinizi takip edin, özel izleme listeleri oluşturun, arkadaşlarınızla etkileşime geçin ve yeni yapımlar keşfedin.',
  keywords: ['dizi takip', 'film takip', 'episodio', 'dizi izleme listesi', 'dizi takvimi', 'film önerileri', 'dizi sosyalleşme'],
  authors: [{ name: 'Episodio' }],
  creator: 'Episodio',
  publisher: 'Episodio',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://episodio.com.tr',
    title: 'Episodio | Dizi ve Film Takip Platformu',
    description: 'Favori dizi ve filmlerinizi takip edin, izleme listeleri oluşturun ve arkadaşlarınızla paylaşın.',
    siteName: 'Episodio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Episodio | Dizi ve Film Takip Platformu',
    description: 'Favori dizi ve filmlerinizi takip edin, izleme listeleri oluşturun ve arkadaşlarınızla paylaşın.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
      <body className="antialiased bg-[#0A0A0A] text-[#F4F6FA]" suppressHydrationWarning>{children}</body>
    </html>
  );
}
