import { getUpcomingShows } from '@/lib/tmdb';
import UpcomingReleasesHeroClient from './UpcomingReleasesHeroClient';

export default async function UpcomingReleasesHero() {
  const shows = await getUpcomingShows();
  if (!shows || shows.length === 0) return null;
  return <UpcomingReleasesHeroClient shows={shows} />;
}
