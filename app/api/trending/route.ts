import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  const res = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return NextResponse.json([]);
  const data = await res.json();
  return NextResponse.json(data.results ?? []);
}
