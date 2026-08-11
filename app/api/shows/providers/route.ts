import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/watch/providers/tv?api_key=${apiKey}&watch_region=TR&language=tr-TR`,
      { cache: 'force-cache', next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    const results = (data.results ?? []) as { provider_id: number; provider_name: string; logo_path: string }[];
    
    // Filtrelenecek en popüler platformlar
    const topIds = [8, 337, 119, 350, 150, 1750, 1899];
    const filtered = results.filter((p) => topIds.includes(p.provider_id));
    return NextResponse.json(filtered.length > 0 ? filtered : results.slice(0, 10));
  } catch {
    return NextResponse.json([]);
  }
}
