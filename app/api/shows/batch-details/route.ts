import { NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || 'd0e8d91e3b9f6091fc38629f10e2e049';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

function formatPosterUrl(path: string | null | undefined): string {
  if (!path || path.trim() === '') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${POSTER_BASE}${path}`;
  return `${POSTER_BASE}/${path}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawIds = searchParams.get('ids') || '';
  const ids = Array.from(
    new Set(
      rawIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );

  if (ids.length === 0) {
    return NextResponse.json({});
  }

  const resultMap: Record<string, { name: string; poster: string }> = {};

  await Promise.all(
    ids.map(async (showId) => {
      try {
        // First try Turkish localization
        let res = await fetch(
          `https://api.themoviedb.org/3/tv/${showId}?api_key=${API_KEY}&language=tr-TR`,
          { next: { revalidate: 86400 } }
        );
        
        let data: any = null;
        if (res.ok) {
          data = await res.json();
        }

        // If poster_path is null or failed, fallback to English / global poster
        if (!data || !data.poster_path) {
          const fallbackRes = await fetch(
            `https://api.themoviedb.org/3/tv/${showId}?api_key=${API_KEY}`,
            { next: { revalidate: 86400 } }
          );
          if (fallbackRes.ok) {
            data = await fallbackRes.json();
          }
        }

        if (data) {
          resultMap[String(showId)] = {
            name: data.name || data.original_name || 'Dizi',
            poster: formatPosterUrl(data.poster_path),
          };
        }
      } catch {
        // ignore individual failure
      }
    })
  );

  return NextResponse.json(resultMap);
}
