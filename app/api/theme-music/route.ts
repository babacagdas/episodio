import { NextResponse } from 'next/server';



function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAuthenticTheme(track: any, searchName: string): boolean {
  if (!track || !track.previewUrl) return false;

  const normSearch = normalizeText(searchName);
  if (!normSearch || normSearch.length < 2) return false;

  const normTrack = normalizeText(track.trackName || '');
  const normCollection = normalizeText(track.collectionName || '');
  const normArtist = normalizeText(track.artistName || '');

  // 1. Dizi adı (normalize edilmiş) parça, albüm veya sanatçı adında tam olarak veya kelime grubu olarak geçmeli!
  const hasShowName =
    normTrack.includes(normSearch) ||
    normCollection.includes(normSearch) ||
    normArtist.includes(normSearch);

  if (!hasShowName) return false;

  // 2. Dizi müziği / Jenerik / Soundtrack / OST anahtar kelimelerinden biri mutlaka olmalı!
  const isSoundtrack =
    normTrack.includes('theme') ||
    normTrack.includes('main title') ||
    normTrack.includes('soundtrack') ||
    normTrack.includes('ost') ||
    normTrack.includes('score') ||
    normTrack.includes('jenerik') ||
    normTrack.includes('dizi muzigi') ||
    normTrack.includes('opening') ||
    normTrack.includes('intro') ||
    normCollection.includes('soundtrack') ||
    normCollection.includes('ost') ||
    normCollection.includes('theme') ||
    normCollection.includes('score') ||
    normCollection.includes('series') ||
    normCollection.includes('dizi');

  return isSoundtrack || (hasShowName && normCollection.includes('music'));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showName = searchParams.get('show') || '';
  const originalName = searchParams.get('original') || '';

  // Orijinal ve Türkçe isimler + normalize edilmiş versiyonları
  const rawNames = [originalName.trim(), showName.trim()].filter(Boolean);
  const namesToTry: string[] = [];

  for (const n of rawNames) {
    if (!n) continue;
    namesToTry.push(n);
    const norm = normalizeText(n);
    if (norm && norm !== n.toLowerCase()) {
      namesToTry.push(norm);
    }
  }

  const uniqueNames = Array.from(new Set(namesToTry));

  if (uniqueNames.length === 0) {
    return NextResponse.json({ previewUrl: null });
  }

  // 1. iTunes Multi-Store (US & TR) Multi-Query Search
  for (const name of uniqueNames) {
    const searchQueries = [
      `${name} main title theme`,
      `${name} soundtrack`,
      `${name} theme`,
      `${name} jenerik`,
    ];

    for (const q of searchQueries) {
      for (const country of ['us', 'tr']) {
        try {
          const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=10&country=${country}`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 86400 },
          });

          if (!res.ok) continue;
          const data = await res.json();
          const results = data.results ?? [];

          if (results.length === 0) continue;

          // Kesin Türkçe ve ASCII karakter doğruluk filtresi
          const match = results.find((t: any) => isAuthenticTheme(t, name));

          if (match && match.previewUrl) {
            return NextResponse.json({
              previewUrl: match.previewUrl,
              trackName: match.trackName,
              artistName: match.artistName,
            });
          }
        } catch {
          // continue
        }
      }
    }
  }

  // 2. Deezer API Multi-Query Fallback (Normalize Filtresi ile)
  for (const name of uniqueNames) {
    try {
      const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(name + ' theme')}`;
      const deezerRes = await fetch(deezerUrl, { next: { revalidate: 86400 } });
      if (deezerRes.ok) {
        const deezerData = await deezerRes.json();
        const dzTrack = deezerData.data?.find((t: any) => {
          if (!t.preview) return false;
          const title = normalizeText(t.title || '');
          const album = normalizeText(t.album?.title || '');
          const artist = normalizeText(t.artist?.name || '');
          const normName = normalizeText(name);

          const hasName = title.includes(normName) || album.includes(normName) || artist.includes(normName);
          const isOST = title.includes('theme') || title.includes('soundtrack') || title.includes('jenerik') || album.includes('soundtrack') || album.includes('ost');

          return hasName && isOST;
        });

        if (dzTrack && dzTrack.preview) {
          return NextResponse.json({
            previewUrl: dzTrack.preview,
            trackName: dzTrack.title,
            artistName: dzTrack.artist?.name || 'Jenerik Müziği',
          });
        }
      }
    } catch {
      // continue
    }
  }

  return NextResponse.json({ previewUrl: null });
}
