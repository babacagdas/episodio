import { NextResponse } from 'next/server';

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
      name,
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

          const cleanLower = name.toLowerCase();

          // En yüksek doğruluklu eşleşmeyi bul
          const match = results.find((t: any) => {
            if (!t.previewUrl) return false;
            const trackName = (t.trackName || '').toLowerCase();
            const collectionName = (t.collectionName || '').toLowerCase();
            const artistName = (t.artistName || '').toLowerCase();

            return (
              trackName.includes(cleanLower) ||
              collectionName.includes(cleanLower) ||
              artistName.includes(cleanLower) ||
              trackName.includes('theme') ||
              trackName.includes('main title') ||
              collectionName.includes('soundtrack') ||
              collectionName.includes('ost')
            );
          }) || results.find((t: any) => !!t.previewUrl);

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

  // 2. Deezer API Multi-Query Fallback
  for (const name of namesToTry) {
    try {
      const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(name + ' theme')}`;
      const deezerRes = await fetch(deezerUrl, { next: { revalidate: 86400 } });
      if (deezerRes.ok) {
        const deezerData = await deezerRes.json();
        const dzTrack = deezerData.data?.find((t: any) => t.preview);
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
