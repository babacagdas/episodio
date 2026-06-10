import { Suspense } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';
import ShowCard from '@/components/ShowCard';
import { CardGridSkeleton } from '@/components/Skeletons';
import { getTrendingShows } from '@/lib/tmdb';
import FriendsActivitySection from './FriendsActivitySection';
import NotificationsBell from './NotificationsBell';
import CurrentlyWatchingCard from './CurrentlyWatchingCard';
import PersonalizedRecommendation from './PersonalizedRecommendation';
import WelcomeHeader from './WelcomeHeader';

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
        <Link href="/home">
          <img alt="Episodio Logo" className="h-16 w-auto object-contain -my-4" src="/logo.png" />
        </Link>
        <NotificationsBell />
      </header>
      <Sidebar />

      <main className="md:ml-[240px] px-margin-mobile md:px-12 py-8 max-w-[1440px] mx-auto overflow-x-hidden">
        <WelcomeHeader />

        <CurrentlyWatchingCard />

        <PersonalizedRecommendation />

        {/* Swiper Tanıtım Kartı */}
        <section className="mb-lg bg-gradient-to-br from-[#E50914]/15 via-black/10 to-[#D4A017]/5 border border-white/[0.06] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden group">
          {/* Arkadaki hafif kırmızı/altın renk sızıntısı */}
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#E50914] rounded-full filter blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 text-[#D4A017] shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
              <span className="material-symbols-outlined text-2xl drop-shadow-[0_0_8px_rgba(212,160,23,0.3)]">style</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
                Kararsız mı Kaldın?
              </h3>
              <p className="text-white/40 text-xs mt-1 max-w-xl leading-relaxed">
                İzleyecek dizi veya film bulamıyorsan popüler yapımları Tinder tarzında sağa ve sola kaydırarak hızlı ve eğlenceli bir şekilde kişisel izleme listeni oluştur!
              </p>
            </div>
          </div>
          
          <Link
            href="/swiper"
            className="shrink-0 self-start md:self-auto px-5 py-3 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B80710] hover:from-[#f40f1c] hover:to-[#cd0812] text-xs font-semibold text-white shadow-[0_4px_15px_rgba(229,9,20,0.3)] transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 border border-red-500/10"
          >
            <span>Kaydırmaya Başla</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </section>

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
