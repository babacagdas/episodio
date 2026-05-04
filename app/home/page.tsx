import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';
import ShowCard from '@/components/ShowCard';
import { CardGridSkeleton } from '@/components/Skeletons';
import { getTrendingShows } from '@/lib/tmdb';
import FriendsActivitySection from './FriendsActivitySection';
import NotificationsBell from './NotificationsBell';
import CurrentlyWatchingCard from './CurrentlyWatchingCard';
import PersonalizedRecommendation from './PersonalizedRecommendation';

async function TrendingGrid() {
  const shows = await getTrendingShows();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      {shows.map((show, i) => (
        <ShowCard key={show.id} show={show} rank={i + 1} />
      ))}
    </div>
  );
}

export default async function Home() {
  return (
    <div className="font-body-md text-body-md antialiased pb-24 md:pb-0">
      <header className="bg-[#0A0A0A]/70 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 top-0 z-50 border-b border-white/5 sticky md:hidden">
        <span className="text-xl font-black text-white uppercase tracking-tighter font-['Be_Vietnam_Pro']">
          EPISODIO<span className="text-[#E50914]">.</span>
        </span>
        <NotificationsBell />
      </header>
      <Sidebar />

      <main className="md:ml-[240px] px-margin-mobile md:px-12 py-8 max-w-[1440px] mx-auto overflow-x-hidden">
        <div className="hidden md:flex justify-between items-end mb-10">
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">Hoş geldin</p>
            <h1 className="font-display-xl text-display-xl text-white">Merhaba 👋</h1>
          </div>
          <NotificationsBell />
        </div>

        <CurrentlyWatchingCard />

        <PersonalizedRecommendation />

        {/* Trending */}
        <section className="mb-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-white">Bu Hafta Trend</h2>
          </div>
          <Suspense fallback={<CardGridSkeleton count={12} />}>
            <TrendingGrid />
          </Suspense>
        </section>

        {/* Friends Activity */}
        <section className="mb-lg">
          <FriendsActivitySection />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
