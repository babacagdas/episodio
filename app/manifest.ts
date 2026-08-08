import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Episodio | Dizi Takip ve Sosyal Ağ Platformu',
    short_name: 'Episodio',
    description: 'Favori dizilerinizi takip edin, özel izleme listeleri oluşturun, arkadaşlarınızla mesajlaşın ve dizi severlerle sosyal bir ağda etkileşime geçin.',
    start_url: '/home',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
