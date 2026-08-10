'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';
import { createClient } from '@/lib/supabase/client';

interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for_department: string | null;
  known_for: { id: number; title: string; media_type: string | null }[];
}

const PROFILE_BASE = 'https://image.tmdb.org/t/p/w500';

export default function ActorMatchPage() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const startX = useRef(0);
  const startY = useRef(0);
  const swipedIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('actor_swipes')
        .select('actor_id')
        .eq('user_id', user.id)
        .limit(1000);

      const nextSwipedIds = new Set((data ?? []).map((item) => Number(item.actor_id)));
      swipedIdsRef.current = nextSwipedIds;
      setUserId(user.id);
    })();
  }, []);

  const loadActors = useCallback(async (pageNum: number, seenIds: Set<number>) => {
    try {
      const res = await fetch(`/api/actors/popular?page=${pageNum}`);
      const data = (await res.json()) as Actor[];
      const filtered = data.filter((actor) => !seenIds.has(actor.id));

      if (pageNum === 1) {
        setActors(filtered);
        setCurrentIndex(0);
      } else {
        setActors((prev) => [...prev, ...filtered]);
      }
      return filtered.length;
    } catch (error) {
      console.error('Oyuncular yüklenirken hata oluştu:', error);
      return 0;
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (page === 1) setLoading(true);
    void loadActors(page, swipedIdsRef.current);
  }, [loadActors, page, userId]);

  const activeActor = actors[currentIndex];

  const swipe = useCallback(async (direction: 'left' | 'right') => {
    if (!activeActor || !userId || swipeDirection) return;

    setSwipeDirection(direction);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const supabase = createClient();
    await supabase.from('actor_swipes').upsert(
      {
        user_id: userId,
        actor_id: activeActor.id,
        actor_name: activeActor.name,
        actor_profile_path: activeActor.profile_path,
        action: direction === 'right' ? 'like' : 'pass',
      },
      { onConflict: 'user_id,actor_id' }
    );

    const nextSwipedIds = new Set(swipedIdsRef.current);
    nextSwipedIds.add(activeActor.id);
    swipedIdsRef.current = nextSwipedIds;
    setDragX(0);
    setDragY(0);
    setSwipeDirection(null);
    setCurrentIndex((prev) => prev + 1);

    if (currentIndex >= actors.length - 5) {
      setPage((prev) => prev + 1);
    }
  }, [activeActor, actors.length, currentIndex, swipeDirection, userId]);

  const fetchMoreActors = useCallback(() => {
    setLoadingMore(true);
    setPage((prev) => prev + 1);
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    if (swipeDirection) return;
    startX.current = clientX;
    startY.current = clientY;
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setDragX(clientX - startX.current);
    setDragY(clientY - startY.current);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragX > 120) {
      void swipe('right');
    } else if (dragX < -120) {
      void swipe('left');
    } else {
      setDragX(0);
      setDragY(0);
    }
  };

  let transformStyle = 'translate(0px, 0px) rotate(0deg)';
  let transitionStyle = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2)';

  if (swipeDirection === 'right') {
    transformStyle = 'translate(150%, 20px) rotate(35deg)';
    transitionStyle = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s';
  } else if (swipeDirection === 'left') {
    transformStyle = 'translate(-150%, 20px) rotate(-35deg)';
    transitionStyle = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s';
  } else if (isDragging) {
    transformStyle = `translate(${dragX}px, ${dragY}px) rotate(${dragX * 0.04}deg)`;
    transitionStyle = 'none';
  }

  const likeOpacity = isDragging ? Math.max(0, Math.min(1, dragX / 100)) : 0;
  const skipOpacity = isDragging ? Math.max(0, Math.min(1, -dragX / 100)) : 0;

  return (
    <div className="font-body-md min-h-screen bg-[#070707] text-white antialiased overflow-x-hidden">
      <Sidebar />

      <header className="bg-[#0A0A0A]/90 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] fixed top-0 left-0 right-0 z-50 border-b border-white/5 md:hidden">
        <Link href="/home" className="w-9 h-9 flex items-center justify-center text-white hover:text-white/75 transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <span className="font-bold text-sm text-white tracking-tight">Oyuncu Eşleştirici</span>
        <Link href="/swiper" className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-all" title="Dizi Eşleştirici">
          <span className="material-symbols-outlined text-lg">style</span>
        </Link>
      </header>

      <main className="md:ml-[200px] flex-1 flex flex-col items-center justify-center relative bg-[#090909] py-4 px-4 overflow-hidden h-[calc(100dvh-68px)] md:h-screen pb-20 md:pb-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_18rem),radial-gradient(circle_at_22%_72%,rgba(201,21,32,0.16),transparent_24rem),linear-gradient(135deg,#050505_0%,#111_46%,rgba(201,21,32,0.13)_100%)] opacity-70" />
          <div className="absolute inset-0 bg-[#070707]/55" />
        </div>

        <Link
          href="/swiper"
          className="absolute right-5 top-5 z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/55 transition-colors hover:border-white/20 hover:text-white md:flex"
        >
          <span className="material-symbols-outlined text-[17px]">style</span>
          Dizi Eşleştirici
        </Link>

        <div className="w-full max-w-[25rem] flex flex-col gap-4 relative z-10 flex-1 justify-center py-2 h-full min-h-0 md:max-w-md">
          {!userId && !loading ? (
            <div className="w-full rounded-2xl bg-[#111111]/92 border border-white/[0.1] p-8 text-center flex flex-col items-center gap-5 shadow-[0_18px_46px_rgba(0,0,0,0.38)] backdrop-blur-lg">
              <div className="w-14 h-14 rounded-xl bg-[#C91520]/10 border border-[#C91520]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#F06A73] text-3xl">person_search</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Giriş Gerekli</h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-xs">
                  Oyuncu tercihlerini kaydedebilmemiz için hesabına giriş yapman gerekiyor.
                </p>
              </div>
              <Link href="/signin" className="w-full py-3 bg-[#C91520] hover:bg-[#A8121B] rounded-xl text-xs font-semibold text-white transition-colors text-center">
                Giriş Yap
              </Link>
            </div>
          ) : loading ? (
            <div className="aspect-[2/3] w-full max-w-sm rounded-2xl bg-[#141414]/80 border border-white/10 flex flex-col items-center justify-center gap-3">
              <span className="w-10 h-10 border-4 border-white/10 border-t-[#C91520] rounded-full animate-spin" />
              <p className="text-xs text-white/30 font-medium">Oyuncular yükleniyor...</p>
            </div>
          ) : !activeActor ? (
            <div className="w-full rounded-2xl bg-[#111111]/92 border border-white/[0.1] p-8 text-center flex flex-col items-center gap-6 shadow-[0_18px_46px_rgba(0,0,0,0.38)] backdrop-blur-lg">
              <div className="w-16 h-16 rounded-xl bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#D4A017] text-3xl">groups</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Yeni Oyuncu Bulalım</h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-xs">
                  Bu destedeki oyuncular bitti. Sıradaki Hollywood ve Avrupa oyuncularını getirebilirsin.
                </p>
              </div>
              <button
                onClick={fetchMoreActors}
                disabled={loadingMore}
                className="w-full py-3 bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all text-center"
              >
                {loadingMore ? 'Oyuncular getiriliyor...' : 'Yeni Oyuncular Getir'}
              </button>
            </div>
          ) : (
            <div className="relative flex-1 flex flex-col justify-center items-center min-h-0">
              <div
                onMouseDown={(event) => handleStart(event.clientX, event.clientY)}
                onMouseMove={(event) => handleMove(event.clientX, event.clientY)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(event) => {
                  if (event.touches[0]) handleStart(event.touches[0].clientX, event.touches[0].clientY);
                }}
                onTouchMove={(event) => {
                  if (event.touches[0]) handleMove(event.touches[0].clientX, event.touches[0].clientY);
                }}
                onTouchEnd={handleEnd}
                style={{
                  transform: transformStyle,
                  transition: transitionStyle,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                className="h-[52dvh] max-h-[33rem] md:h-auto md:w-full aspect-[2/3] rounded-2xl overflow-hidden bg-[#141414] border border-white/[0.1] shadow-[0_26px_56px_-14px_rgba(0,0,0,0.78)] relative select-none touch-none"
              >
                {activeActor.profile_path ? (
                  <img
                    alt={activeActor.name}
                    src={`${PROFILE_BASE}${activeActor.profile_path}`}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable="false"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#181818] text-white/10 gap-2">
                    <span className="material-symbols-outlined text-6xl">person</span>
                    <span className="text-xs">Görsel Yok</span>
                  </div>
                )}

                <div
                  style={{ opacity: likeOpacity }}
                  className="absolute top-6 left-6 border-4 border-green-500 text-green-500 font-black text-xl uppercase tracking-widest px-3 py-1 rounded-xl rotate-[-12deg] z-20 pointer-events-none bg-black/20 backdrop-blur-sm shadow-[0_4px_15px_rgba(34,197,94,0.2)]"
                >
                  BEĞEN
                </div>

                <div
                  style={{ opacity: skipOpacity }}
                  className="absolute top-6 right-6 border-4 border-[#C91520] text-[#C91520] font-black text-xl uppercase tracking-widest px-3 py-1 rounded-xl rotate-[12deg] z-20 pointer-events-none bg-black/20 backdrop-blur-sm shadow-[0_4px_15px_rgba(201,21,32,0.18)]"
                >
                  GEÇ
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent pointer-events-none z-10" />

                <div className="absolute bottom-0 left-0 w-full p-4 z-20 text-left pointer-events-none flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/60 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-md backdrop-blur-md">
                      Oyuncu
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {activeActor.name}
                  </h2>
                  {activeActor.known_for.length > 0 && (
                    <p className="text-[10px] text-white/55 line-clamp-2 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {activeActor.known_for.map((item) => item.title).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-center items-center gap-6 mt-4">
                <button
                  onClick={() => void swipe('left')}
                  className="w-11 h-11 rounded-full bg-[#C91520]/10 hover:bg-[#C91520]/18 border border-[#C91520]/25 hover:border-[#C91520]/55 active:scale-90 text-[#F06A73] hover:text-white flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(201,21,32,0.14)]"
                  title="Pas Geç"
                >
                  <span className="material-symbols-outlined text-xl font-bold">close</span>
                </button>

                <button
                  onClick={() => void swipe('right')}
                  className="w-11 h-11 rounded-full bg-emerald-500/10 hover:bg-emerald-500/18 border border-emerald-400/25 hover:border-emerald-400/55 active:scale-90 text-emerald-300 hover:text-white flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(16,185,129,0.14)]"
                  title="Beğen"
                >
                  <span className="material-symbols-outlined text-xl">favorite</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
