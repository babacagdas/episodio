import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  const data = await res.json();
  return NextResponse.json(data.results ?? []);
}
