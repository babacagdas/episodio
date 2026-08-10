import { getHeroShows } from '@/lib/tmdb';
import HomeHeroClient from './HomeHeroClient';

export default async function HomeHero() {
  const heroShows = await getHeroShows();
  return <HomeHeroClient shows={heroShows} />;
}

