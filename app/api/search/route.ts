import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return NextResponse.json([]);

  const res = await fetch(
    `https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR&query=${encodeURIComponent(q)}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  return NextResponse.json(data.results ?? []);
}
