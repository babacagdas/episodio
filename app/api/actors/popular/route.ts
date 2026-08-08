import { NextResponse } from 'next/server';

interface TmdbKnownForItem {
  id: number;
  name?: string;
  title?: string;
  media_type?: string;
  original_language?: string;
  origin_country?: string[];
}

interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for_department?: string;
  known_for?: TmdbKnownForItem[];
}

const WESTERN_LANGUAGES = new Set([
  'en',
  'fr',
  'de',
  'es',
  'it',
  'pt',
  'nl',
  'sv',
  'da',
  'no',
  'fi',
  'pl',
]);

const WESTERN_COUNTRIES = new Set([
  'US',
  'GB',
  'CA',
  'AU',
  'IE',
  'FR',
  'DE',
  'ES',
  'IT',
  'PT',
  'NL',
  'SE',
  'DK',
  'NO',
  'FI',
  'PL',
]);

function isWesternActor(person: TmdbPerson) {
  const knownFor = person.known_for ?? [];
  if (person.known_for_department && person.known_for_department !== 'Acting') return false;
  if (knownFor.length === 0) return false;

  return knownFor.some((item) => {
    const languageMatch = item.original_language ? WESTERN_LANGUAGES.has(item.original_language) : false;
    const countryMatch = (item.origin_country ?? []).some((country) => WESTERN_COUNTRIES.has(country));
    return languageMatch || countryMatch;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPage = Number(searchParams.get('page') || '1');
  const page = Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 500 ? rawPage : 1;

  const apiKey = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  try {
    const seen = new Set<number>();
    const actors = [];

    for (let pageNumber = page; pageNumber <= Math.min(page + 9, 500) && actors.length < 24; pageNumber += 1) {
      const res = await fetch(
        `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=tr-TR&page=${pageNumber}`,
        { cache: 'no-store' }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const pageActors = ((data.results ?? []) as TmdbPerson[])
        .filter((person) => person.profile_path)
        .filter(isWesternActor)
        .filter((person) => {
          if (seen.has(person.id)) return false;
          seen.add(person.id);
          return true;
        })
        .map((person) => ({
          id: person.id,
          name: person.name,
          profile_path: person.profile_path,
          popularity: person.popularity,
          known_for_department: person.known_for_department ?? null,
          known_for: (person.known_for ?? [])
            .filter((item) => item.name || item.title)
            .slice(0, 3)
            .map((item) => ({
              id: item.id,
              title: item.name ?? item.title ?? 'Bilinmeyen yapım',
              media_type: item.media_type ?? null,
            })),
        }));

      actors.push(...pageActors);
    }

    return NextResponse.json(actors.slice(0, 24));
  } catch (error) {
    console.error('Popular actors API error:', error);
    return NextResponse.json([]);
  }
}
