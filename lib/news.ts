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

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Stranger Things 5. Sezon: Yayın Tarihi ve İlk Teaser Yayınlandı!',
    snippet: 'Netflix, efsane dizinin final sezonu için geri sayımı başlattı. Hawkins mücadelesinde sona geliniyor.',
    link: 'https://variety.com',
    pubDate: 'Bugün',
    imageUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1000&auto=format&fit=crop',
    source: 'Variety',
    category: 'Son Dakika',
  },
  {
    id: 'news-2',
    title: 'House of the Dragon 3. Sezon Çekimleri Başladı: Yeni Ejderhalar Geliyor',
    snippet: 'HBO, Westeros evrenindeki iç savaşın 3. sezonunda yepyeni hanedanlar ve ejderhaların katılacağını müjdeledi.',
    link: 'https://tvline.com',
    pubDate: '1 saat önce',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    source: 'TVLine',
    category: 'Gelişme',
  },
  {
    id: 'news-3',
    title: 'The Last of Us 2. Sezon: Abby Karakterinin İlk Görselleri Sızdırıldı',
    snippet: 'HBO prodüksiyon setinden gelen yeni görüntüler internette olay yarattı. İkinci sezon sürprizlerle dolu.',
    link: 'https://collider.com',
    pubDate: '3 saat önce',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    source: 'Collider',
    category: 'Özel Haber',
  },
  {
    id: 'news-4',
    title: 'Wednesday 2. Sezon Kadrosuna Sürpriz Yıldız İsim Katıldı',
    snippet: 'Tim Burton önderliğindeki sevilen dizinin yeni sezon kadrosu genişliyor. Çekimler İrlanda’da devam ediyor.',
    link: 'https://hollywoodreporter.com',
    pubDate: '5 saat önce',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop',
    source: 'Hollywood Reporter',
    category: 'Kadro',
  },
];

export async function getTvNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://collider.com/feed/category/tv/', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_NEWS;
    const xml = await res.text();

    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 6) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const imgMatch = itemXml.match(/<media:content[^>]+url="([^"]+)"/) || itemXml.match(/src="([^"]+\.(?:jpg|png|jpeg|webp)[^"]*)"/i);

      if (titleMatch && linkMatch) {
        const rawTitle = titleMatch[1].replace(/&#\d+;/g, '').trim();
        const rawLink = linkMatch[1].trim();
        const rawImg = imgMatch ? imgMatch[1] : FALLBACK_NEWS[count % FALLBACK_NEWS.length].imageUrl;
        const pubDateRaw = pubDateMatch ? new Date(pubDateMatch[1]).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Bugün';

        items.push({
          id: `live-news-${count}`,
          title: rawTitle,
          snippet: 'Dizi dünyasından en son gelişmeler ve yayın detayları haberimizde.',
          link: rawLink,
          pubDate: pubDateRaw,
          imageUrl: rawImg,
          source: 'Collider TV',
          category: count === 0 ? 'Son Dakika' : 'Dizi Haberi',
        });
        count++;
      }
    }

    return items.length > 0 ? items : FALLBACK_NEWS;
  } catch {
    return FALLBACK_NEWS;
  }
}
