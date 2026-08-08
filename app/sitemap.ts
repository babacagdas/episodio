import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://episodio.com.tr';

  const routes = [
    '',
    '/signin',
    '/signup',
    '/home',
    '/search',
    '/swiper',
    '/actor-match',
    '/watchlist',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes;
}
