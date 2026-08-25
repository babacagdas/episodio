import { NextRequest, NextResponse } from 'next/server';



export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; seasonNumber: string }> }) {
  const { id, seasonNumber } = await params;
  const showId = Number(id);
  const season = Number(seasonNumber);
  if (!Number.isInteger(showId) || showId <= 0 || !Number.isInteger(season) || season < 0) {
    return NextResponse.json([], { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  const tmdbUrl = new URL(`https://api.themoviedb.org/3/tv/${showId}/season/${season}`);
  tmdbUrl.searchParams.set('api_key', apiKey);
  tmdbUrl.searchParams.set('language', 'tr-TR');

  const res = await fetch(
    tmdbUrl.toString(),
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    return NextResponse.json([], { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data.episodes ?? []);
}
