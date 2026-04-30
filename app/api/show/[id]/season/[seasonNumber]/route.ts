import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; seasonNumber: string }> }) {
  const { id, seasonNumber } = await params;
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    return NextResponse.json([], { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data.episodes ?? []);
}
