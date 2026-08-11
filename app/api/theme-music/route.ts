import { NextResponse } from 'next/server';

function isAuthenticTheme(track: any, name: string): boolean {
  if (!track || !track.previewUrl) return false;

  const cleanName = name.toLowerCase().trim();
  const trackName = (track.trackName || '').toLowerCase();
  const collectionName = (track.collectionName || '').toLowerCase();
  const artistName = (track.artistName || '').toLowerCase();

  // 1. Dizi adı parça adında, albüm adında veya sanatçı adında geçmeli!
  const hasShowName =
    trackName.includes(cleanName) ||
    collectionName.includes(cleanName) ||
    artistName.includes(cleanName);

  if (!hasShowName) return false;

  // 2. Dizi müziği, Jenerik, Soundtrack, OST veya Main Title ifadesi içermeli!
  const isSoundtrack =
    trackName.includes('theme') ||
    trackName.includes('main title') ||
    trackName.includes('soundtrack') ||
    trackName.includes('ost') ||
    trackName.includes('score') ||
    trackName.includes('jenerik') ||
    trackName.includes('dizi müziği') ||
    trackName.includes('opening') ||
    trackName.includes('intro') ||
    collectionName.includes('soundtrack') ||
    collectionName.includes('ost') ||
    collectionName.includes('theme') ||
    collectionName.includes('score') ||
    collectionName.includes('series') ||
    collectionName.includes('dizi');

  return isSoundtrack || (hasShowName && (collectionName.includes('music') || collectionName.includes('album')));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showName = searchParams.get('show') || '';
  const originalName = searchParams.get('original') || '';

  const namesToTry = Array.from(
    new Set([originalName.trim(), showName.trim()].filter(Boolean))
  );

  if (namesToTry.length === 0) {
    return NextResponse.json({ previewUrl: null });
  }

  // 1. iTunes Multi-Store (US & TR) Multi-Query Search
  for (const name of namesToTry) {
    const searchQueries = [
      `${name} main title theme`,
      `${name} soundtrack`,
      `${name} theme`,
      `${name} jenerik müziği`,
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

          // Kesin doğruluk filtresi (Alakasız şarkılar tamamen reddedilir)
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

  // 2. Deezer API Multi-Query Fallback (Katı Filtre ile)
  for (const name of namesToTry) {
    try {
      const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(name + ' theme')}`;
      const deezerRes = await fetch(deezerUrl, { next: { revalidate: 86400 } });
      if (deezerRes.ok) {
        const deezerData = await deezerRes.json();
        const dzTrack = deezerData.data?.find((t: any) => {
          if (!t.preview) return false;
          const title = (t.title || '').toLowerCase();
          const album = (t.album?.title || '').toLowerCase();
          const artist = (t.artist?.name || '').toLowerCase();
          const cleanName = name.toLowerCase();

          const hasName = title.includes(cleanName) || album.includes(cleanName) || artist.includes(cleanName);
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
