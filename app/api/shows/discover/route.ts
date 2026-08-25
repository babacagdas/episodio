import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPage = Number(searchParams.get('page') || '1');
  const page = Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 500 ? rawPage : 1;

  const apiKey = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=tr-TR&page=${page}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(data.results ?? []);
  } catch (error) {
    console.error('Discover shows API error:', error);
    return NextResponse.json([]);
  }
}
