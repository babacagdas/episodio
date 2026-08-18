import { MetadataRoute } from 'next';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '4f3b798b31a26d70c48e8946e336b135';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://episodio.com.tr';

  const staticRoutes = [
    '',
    '/signin',
    '/signup',
    '/home',
    '/search',
    '/swiper',
    '/actor-match',
    '/watchlist',
    '/privacy',
    '/kvkk',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // TMDB'den popüler dizileri ve oyuncuları çekip Google Sitemap'e ekleme
  let dynamicShowRoutes: MetadataRoute.Sitemap = [];
  let dynamicPersonRoutes: MetadataRoute.Sitemap = [];

  try {
    const resShows = await fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}&language=tr-TR`, {
      next: { revalidate: 86400 },
    });
    if (resShows.ok) {
      const data = await resShows.json();
      dynamicShowRoutes = (data.results || []).slice(0, 40).map((show: { id: number }) => ({
        url: `${baseUrl}/show/${show.id}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
    }
  } catch {
    // ignore
  }

  try {
    const resPeople = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${API_KEY}&language=tr-TR`, {
      next: { revalidate: 86400 },
    });
    if (resPeople.ok) {
      const data = await resPeople.json();
      dynamicPersonRoutes = (data.results || []).slice(0, 20).map((person: { id: number }) => ({
        url: `${baseUrl}/person/${person.id}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch {
    // ignore
  }

  return [...staticRoutes, ...dynamicShowRoutes, ...dynamicPersonRoutes];
}
