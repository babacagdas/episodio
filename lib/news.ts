export interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  link: string;
  pubDate: string;
  imageUrl: string;
  source: string;
  category: string;
}

const POPULAR_TV_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Stranger Things 5. Sezon: Yayın Tarihi ve İlk Teaser Yayınlandı!',
    snippet: 'Netflix, efsane dizinin final sezonu için geri sayımı başlattı. Hawkins mücadelesinde sona geliniyor ve Waffle devri kapanıyor.',
    link: 'https://variety.com',
    pubDate: 'Bugün',
    imageUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1000&auto=format&fit=crop',
    source: 'Netflix Gündem',
    category: 'Final Sezonu',
  },
  {
    id: 'news-2',
    title: 'Wednesday 2. Sezon Çekimleri Başladı: Yeni Sezon Kadrosu Açıklandı',
    snippet: 'Nevermore Akademisi kapılarını yeniden açıyor. Tim Burton önderliğindeki sevilen dizinin 2. sezon çekimleri İrlanda’da tam gaz sürüyor.',
    link: 'https://tvline.com',
    pubDate: '2 saat önce',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop',
    source: 'TVLine',
    category: 'Yeni Sezon',
  },
  {
    id: 'news-3',
    title: 'House of the Dragon 3. Sezon: Ejderhaların Savaşı Şiddetleniyor',
    snippet: 'HBO, Siyahlar ve Yeşiller arasındaki kanlı mücadelenin 3. sezonunda yepyeni hanedanlar ve dev ejderhaların katılacağını müjdeledi.',
    link: 'https://collider.com',
    pubDate: '4 saat önce',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    source: 'HBO Max',
    category: 'Özel Gelişme',
  },
  {
    id: 'news-4',
    title: 'The Last of Us 2. Sezon: Abby Karakterinin İlk Sızan Görselleri',
    snippet: 'Kaitlyn Dever’ın canlandırdığı Abby karakterinin set görüntüleri sosyal medyayı salladı. İkinci sezon sürprizlerle dolu geliyor.',
    link: 'https://hollywoodreporter.com',
    pubDate: '6 saat önce',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    source: 'Hollywood Reporter',
    category: 'Set Detayı',
  },
  {
    id: 'news-5',
    title: 'Squid Game 2. Sezon: Gi-hun Yeni Oyunlarda İntikam Peşinde',
    snippet: 'Netflix’in rekor kıran dizisi Squid Game’in 2. sezonundan merakla beklenen ilk resmi fragman ve görseller paylaşıldı.',
    link: 'https://variety.com',
    pubDate: 'Dün',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop',
    source: 'Variety',
    category: 'Fragman',
  },
  {
    id: 'news-6',
    title: 'Severance 2. Sezon: Lumen Şirketinin Gizemleri Çözülüyor',
    snippet: 'Apple TV+ efsane psikolojik gerilim dizisi Severance’ın yeni sezon yayın tarihini resmi bir video ile duyurdu.',
    link: 'https://tvline.com',
    pubDate: 'Dün',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
    source: 'Apple TV+',
    category: 'Duyuru',
  },
];

export async function getTvNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://collider.com/feed/category/tv/', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return POPULAR_TV_NEWS;
    const xml = await res.text();

    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 8) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const imgMatch = itemXml.match(/<media:content[^>]+url="([^"]+)"/) || itemXml.match(/src="([^"]+\.(?:jpg|png|jpeg|webp)[^"]*)"/i);

      if (titleMatch && linkMatch) {
        const rawTitle = titleMatch[1].replace(/&#\d+;/g, '').trim();
        const rawLink = linkMatch[1].trim();
        const fallbackObj = POPULAR_TV_NEWS[count % POPULAR_TV_NEWS.length];
        const rawImg = imgMatch ? imgMatch[1] : fallbackObj.imageUrl;
        const pubDateRaw = pubDateMatch ? new Date(pubDateMatch[1]).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Bugün';

        items.push({
          id: `live-news-${count}`,
          title: rawTitle,
          snippet: fallbackObj.snippet,
          link: rawLink,
          pubDate: pubDateRaw,
          imageUrl: rawImg,
          source: fallbackObj.source,
          category: fallbackObj.category,
        });
        count++;
      }
    }

    return items.length >= 4 ? items : POPULAR_TV_NEWS;
  } catch {
    return POPULAR_TV_NEWS;
  }
}
