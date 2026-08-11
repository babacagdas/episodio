import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showName = searchParams.get('show') || '';

  if (!showName.trim()) {
    return NextResponse.json({ previewUrl: null });
  }

  const cleanShowName = showName.trim();

  // 1. iTunes sorgu alternatifleri
  const searchQueries = [
    `${cleanShowName} main title`,
    `${cleanShowName} soundtrack`,
    `${cleanShowName} theme`,
    cleanShowName,
  ];

  for (const q of searchQueries) {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=8`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 86400 }, // 24 saat sunucu önbelleği (Ultra hızlı)
      });

      if (!res.ok) continue;

      const data = await res.json();
      const results = data.results ?? [];

      if (results.length === 0) continue;

      const cleanLower = cleanShowName.toLowerCase();

      // En iyi eşleşmeyi bul
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
      // Bir sonraki sorguyu dene
    }
  }

  // 2. iTunes'da bulunamazsa Deezer Public API Fallback (0 DB Yükü!)
  try {
    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(cleanShowName + ' theme')}`;
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
    // ignore
  }

  return NextResponse.json({ previewUrl: null });
}
