import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { BottomNav, MobileHeader } from '@/components/Nav';
import ShowCard from '@/components/ShowCard';
import { CardGridSkeleton } from '@/components/Skeletons';
import { getTrendingShows } from '@/lib/tmdb';
import FriendsActivitySection from './FriendsActivitySection';
import NotificationsBell from './NotificationsBell';
import CurrentlyWatchingCard from './CurrentlyWatchingCard';
import PersonalizedRecommendation from './PersonalizedRecommendation';
import HomeTopBar from './HomeTopBar';
import HomeHero from './HomeHero';
import HomeListRail from './HomeListRail';
import HomeRightRail from './HomeRightRail';
import WelcomeOnboardingModal from './WelcomeOnboardingModal';
import DeferredClientSection from './DeferredClientSection';

function TopBarFallback() {
  return (
    <div className="mb-7 hidden w-full items-start justify-between gap-6 py-2 lg:flex">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="h-9 w-80 rounded-full border border-white/[0.06] bg-transparent" />
        <div className="h-9 w-[460px] rounded-full border border-white/[0.06] bg-transparent" />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <div className="h-9 w-28 rounded-full border border-white/[0.06]" />
        <div className="h-9 w-9 rounded-full border border-white/[0.06]" />
        <div className="h-9 w-9 rounded-full border border-white/[0.06]" />
      </div>
    </div>
  );
}

function HomeHeroFallback() {
  return (
    <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-12">
      <div className="min-h-[300px] rounded-2xl border border-white/[0.06] md:col-span-12" />
    </section>
  );
}

function SectionFallback({ tall = false }: { tall?: boolean }) {
  return (
    <section className="mb-8">
      <div className="mb-4 h-5 w-36 rounded-full border border-white/[0.06]" />
      <div className={`rounded-xl border border-white/[0.06] ${tall ? 'h-72' : 'h-28'}`} />
    </section>
  );
}

function RightRailFallback() {
  return (
    <aside className="hidden w-[300px] shrink-0 flex-col gap-5 2xl:flex">
      <div className="h-60 rounded-2xl border border-white/[0.06]" />
      <div className="h-72 rounded-2xl border border-white/[0.06]" />
      <div className="h-52 rounded-2xl border border-white/[0.06]" />
    </aside>
  );
}

async function TrendingGrid() {
  const shows = await getTrendingShows();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {shows.slice(0, 8).map((show, i) => (
        <ShowCard key={show.id} show={show} rank={i + 1} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="font-body-md text-body-md antialiased pb-32 md:pb-0 pt-[60px] md:pt-0">
      <WelcomeOnboardingModal />

      <MobileHeader rightElement={<NotificationsBell />} />

      <Sidebar />

      <main className="overflow-x-hidden px-margin-mobile py-7 md:ml-[240px] md:px-10 2xl:pr-8">
        <div className="mx-auto flex max-w-[1540px] gap-7">
          <div className="min-w-0 flex-1">
            <Suspense fallback={<TopBarFallback />}>
              <HomeTopBar />
            </Suspense>

            <Suspense fallback={<HomeHeroFallback />}>
              <HomeHero />
            </Suspense>

            <Suspense fallback={<SectionFallback />}>
              <CurrentlyWatchingCard />
            </Suspense>

            <Suspense fallback={<SectionFallback tall />}>
              <PersonalizedRecommendation />
            </Suspense>

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-white">Bu Hafta Trend</h2>
                <Link href="/search" className="inline-flex items-center gap-1 text-xs font-semibold text-[#C91520] transition-colors hover:text-white">
                  Tümünü Gör
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Link>
              </div>
              <Suspense fallback={<CardGridSkeleton count={8} />}>
                <TrendingGrid />
              </Suspense>
            </section>

            <Suspense fallback={<SectionFallback />}>
              <HomeListRail />
            </Suspense>

            <section className="mb-8 2xl:hidden">
              <DeferredClientSection fallback={<SectionFallback />} delay={450}>
                <FriendsActivitySection />
              </DeferredClientSection>
            </section>
          </div>

          <Suspense fallback={<RightRailFallback />}>
            <HomeRightRail />
          </Suspense>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
