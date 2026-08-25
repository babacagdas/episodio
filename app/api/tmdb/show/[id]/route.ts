import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id?.trim()) return NextResponse.json({ backdrop_path: null, name: null });

  const apiKey = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return NextResponse.json({ backdrop_path: null, name: null });

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${encodeURIComponent(id)}?api_key=${apiKey}&language=tr-TR`,
    { cache: 'no-store' }
  );
  if (!res.ok) return NextResponse.json({ backdrop_path: null, name: null });
  const data = (await res.json()) as { backdrop_path?: string | null; name?: string };
  return NextResponse.json({
    backdrop_path: data.backdrop_path ?? null,
    name: data.name ?? null,
  });
}
