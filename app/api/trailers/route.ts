import { NextResponse } from 'next/server';
import { getLatestTvTrailers } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const trailers = await getLatestTvTrailers();
    return NextResponse.json(trailers);
  } catch {
    return NextResponse.json([]);
  }
}
