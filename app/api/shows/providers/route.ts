import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export interface ProviderItem {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  try {
    const [tvRes, movieRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/watch/providers/tv?api_key=${apiKey}&watch_region=TR&language=tr-TR`, { cache: 'force-cache', next: { revalidate: 86400 } }),
      fetch(`https://api.themoviedb.org/3/watch/providers/movie?api_key=${apiKey}&watch_region=TR&language=tr-TR`, { cache: 'force-cache', next: { revalidate: 86400 } }),
    ]);

    const tvData = tvRes.ok ? await tvRes.json() : { results: [] };
    const movieData = movieRes.ok ? await movieRes.json() : { results: [] };

    const mergedMap = new Map<number, ProviderItem>();

    [...(tvData.results ?? []), ...(movieData.results ?? [])].forEach((p: ProviderItem) => {
      if (p.provider_id && p.logo_path && !mergedMap.has(p.provider_id)) {
        mergedMap.set(p.provider_id, {
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        });
      }
    });

    // Öncül sıralama (En popüler TR platformları en önde)
    const priorityIds = [8, 119, 337, 350, 150, 1791, 1826, 2235, 1904, 1905, 11, 1899, 188];
    const providers = Array.from(mergedMap.values());

    providers.sort((a, b) => {
      const idxA = priorityIds.indexOf(a.provider_id);
      const idxB = priorityIds.indexOf(b.provider_id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.provider_name.localeCompare(b.provider_name, 'tr');
    });

    return NextResponse.json(providers);
  } catch {
    return NextResponse.json([]);
  }
}
