'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';
import { useWatchlist, WatchlistItem } from '@/lib/useWatchlist';
import { CardSkeleton } from '@/components/Skeletons';

interface Show {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
  overview?: string;
}

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

export default function SwiperPage() {
  const { watchlist, toggle, loading: loadingWatchlist } = useWatchlist();

  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sürükleme State'leri
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const startX = useRef(0);
  const startY = useRef(0);

  // TMDB'den popüler dizileri getir
  const loadShows = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/shows/discover?page=${pageNum}`);
      const data = (await res.json()) as Show[];
      
      // İzleme listesinde halihazırda olan dizileri ele
      const filtered = data.filter(
        (show) => !watchlist.some((w) => w.id === show.id)
      );
      
      if (pageNum === 1) {
        setShows(filtered);
        setCurrentIndex(0);
      } else {
        setShows((prev) => [...prev, ...filtered]);
      }
    } catch (error) {
      console.error('Diziler yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  // Sayfa yüklendiğinde ve watchlist hazır olduğunda dizileri yükle
  useEffect(() => {
    if (!loadingWatchlist) {
      loadShows(page);
    }
  }, [loadingWatchlist, page, loadShows]);

  const activeShow = shows[currentIndex];

  // Sağa/Sola Fırlatma Efekti ve İşlemi
  const swipe = useCallback(async (direction: 'left' | 'right') => {
    if (!activeShow) return;

    setSwipeDirection(direction);

    // Animasyon süresi kadar bekle
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (direction === 'right') {
      const watchlistItem: WatchlistItem = {
        id: activeShow.id,
        name: activeShow.name,
        poster_path: activeShow.poster_path,
        vote_average: activeShow.vote_average,
        first_air_date: activeShow.first_air_date,
      };
      await toggle(watchlistItem);
    }

    setDragX(0);
    setDragY(0);
    setSwipeDirection(null);
    setCurrentIndex((prev) => prev + 1);

    // Eğer destede az kart kaldıysa bir sonraki popüler sayfasını çek
    if (currentIndex >= shows.length - 5) {
      setPage((p) => p + 1);
    }
  }, [activeShow, toggle, currentIndex, shows.length]);

  // Sürükleme Olayları (Mouse & Touch)
  const handleStart = (clientX: number, clientY: number) => {
    if (swipeDirection) return; // Fırlatma animasyonu çalışırken sürükleme yapılmasın
    startX.current = clientX;
    startY.current = clientY;
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;
    setDragX(diffX);
    setDragY(diffY);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 120;
    if (dragX > threshold) {
      swipe('right');
    } else if (dragX < -threshold) {
      swipe('left');
    } else {
      setDragX(0);
      setDragY(0);
    }
  };

  // Mouse Olayları
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    handleEnd();
  };

  // Dokunmatik (Touch) Olayları
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // Kartın dinamik transform/rotasyon stilleri
  let transformStyle = '';
  let transitionStyle = 'transform 0.15s ease-out';

  if (swipeDirection === 'right') {
    transformStyle = 'translate(150%, 20px) rotate(35deg)';
    transitionStyle = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s';
  } else if (swipeDirection === 'left') {
    transformStyle = 'translate(-150%, 20px) rotate(-35deg)';
    transitionStyle = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s';
  } else if (isDragging) {
    transformStyle = `translate(${dragX}px, ${dragY}px) rotate(${dragX * 0.04}deg)`;
    transitionStyle = 'none';
  } else {
    transformStyle = 'translate(0px, 0px) rotate(0deg)';
    transitionStyle = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2)';
  }

  // Rozetlerin opaklık değerleri
  const likeOpacity = isDragging ? Math.max(0, Math.min(1, dragX / 100)) : 0;
  const skipOpacity = isDragging ? Math.max(0, Math.min(1, -dragX / 100)) : 0;

  return (
    <div className="font-body-md min-h-screen bg-[#070707] text-white antialiased pb-24 md:pb-0 overflow-x-hidden flex">
      <Sidebar />

      {/* Üst Bar (Mobil) */}
      <header className="bg-[#0A0A0A]/70 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 top-0 z-50 border-b border-white/5 sticky md:hidden">
        <Link href="/home" className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white hover:bg-white/10 transition-all">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <span className="font-bold text-sm text-white tracking-tight">Dizi Eşleştirici</span>
        <div className="w-9 h-9" />
      </header>

      <main className="md:ml-[240px] flex-1 flex flex-col h-full w-full items-center justify-center relative bg-[#090909] py-8 px-4 overflow-hidden min-h-[calc(100vh-68px)] md:min-h-screen">
        
        {/* Sinematik Arka Plan Blobları */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
          <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] bg-[#E50914] rounded-full filter blur-[120px] animate-pulse duration-[7000ms]" />
          <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-[#D4A017] rounded-full filter blur-[100px] opacity-75 animate-pulse duration-[9000ms]" />
        </div>

        {/* Eşleştirici Alanı */}
        <div className="w-full max-w-sm flex flex-col gap-6 relative z-10 flex-1 justify-center py-4">
          {loading ? (
            <div className="aspect-[2/3] w-full max-w-sm rounded-3xl bg-[#141414]/80 border border-white/5 flex flex-col items-center justify-center gap-3">
              <span className="w-10 h-10 border-4 border-white/10 border-t-[#E50914] rounded-full animate-spin" />
              <p className="text-xs text-white/30 font-medium">Diziler yükleniyor...</p>
            </div>
          ) : !activeShow ? (
            // Deste Bittiğinde Gösterilecek Alan
            <div className="w-full rounded-3xl bg-[#111111]/85 border border-white/[0.08] p-8 text-center flex flex-col items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-[chatScaleIn_0.3s_ease-out_forwards]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A017]/25 to-[#D4A017]/5 border border-[#D4A017]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#D4A017] text-3xl">style</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Tüm Kartlar Bitti!</h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-xs">
                  Şu anki trend ve popüler dizilerin tamamını taradın. Dilersen listeni gözden geçirebilir ya da yeni diziler keşfetmek için sayfayı yenileyebilirsin.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Link
                  href="/watchlist"
                  className="w-full py-3 bg-gradient-to-br from-[#E50914] to-[#B80710] hover:from-[#f40f1c] hover:to-[#cd0812] rounded-xl text-xs font-semibold text-white transition-all text-center flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(229,9,20,0.3)] border border-red-500/10"
                >
                  <span className="material-symbols-outlined text-sm">bookmark</span>
                  <span>İzleme Listeme Git</span>
                </Link>
                <button
                  onClick={() => {
                    setPage(1);
                    setLoading(true);
                    loadShows(1);
                  }}
                  className="w-full py-3 bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all text-center"
                >
                  Baştan Başla
                </button>
              </div>
            </div>
          ) : (
            // Aktif Sürükleme Kartı
            <div className="relative flex-1 flex flex-col justify-center">
              <div
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  transform: transformStyle,
                  transition: transitionStyle,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                className="w-full aspect-[2/3] rounded-3xl overflow-hidden bg-[#141414] border border-white/[0.08] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative select-none touch-none"
              >
                {/* Afiş */}
                {activeShow.poster_path ? (
                  <img
                    alt={activeShow.name}
                    src={`${POSTER_BASE}${activeShow.poster_path}`}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable="false"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#181818] text-white/10 gap-2">
                    <span className="material-symbols-outlined text-6xl">movie</span>
                    <span className="text-xs">Görsel Yok</span>
                  </div>
                )}

                {/* Sürükleme Rozetleri */}
                {/* LIKE (Beğen) Rozeti */}
                <div
                  style={{ opacity: likeOpacity }}
                  className="absolute top-8 left-8 border-4 border-green-500 text-green-500 font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-xl rotate-[-12deg] z-20 pointer-events-none bg-black/20 backdrop-blur-sm shadow-[0_4px_15px_rgba(34,197,94,0.2)]"
                >
                  KAYDET
                </div>

                {/* SKIP (Pas Geç) Rozeti */}
                <div
                  style={{ opacity: skipOpacity }}
                  className="absolute top-8 right-8 border-4 border-red-500 text-red-500 font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-xl rotate-[12deg] z-20 pointer-events-none bg-black/20 backdrop-blur-sm shadow-[0_4px_15px_rgba(239,68,68,0.2)]"
                >
                  GEÇ
                </div>

                {/* Karartma Degrade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10" />

                {/* Şov Bilgileri */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 text-left pointer-events-none flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {activeShow.vote_average > 0 && (
                      <div className="flex items-center gap-0.5 bg-black/40 border border-white/10 px-2 py-0.5 rounded-lg backdrop-blur-md">
                        <span className="material-symbols-outlined text-[#D4A017] text-xs">star</span>
                        <span className="text-[11px] font-bold text-white/90">
                          {activeShow.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {activeShow.first_air_date && (
                      <span className="text-[10px] text-white/50 bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg backdrop-blur-md">
                        {new Date(activeShow.first_air_date).getFullYear()}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {activeShow.name}
                  </h2>
                  {activeShow.overview && (
                    <p className="text-xs text-white/60 line-clamp-3 leading-relaxed mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {activeShow.overview}
                    </p>
                  )}
                </div>
              </div>

              {/* Alt Kontrol Butonları */}
              <div className="flex justify-center items-center gap-6 mt-6">
                {/* GEÇ Butonu (Sola fırlat) */}
                <button
                  onClick={() => swipe('left')}
                  className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 active:scale-90 text-white/50 hover:text-red-500 flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
                  title="Pas Geç"
                >
                  <span className="material-symbols-outlined text-2xl font-bold">close</span>
                </button>

                {/* İNCELE Butonu (Şov Detayına Git) */}
                <Link
                  href={`/show/${activeShow.id}`}
                  className="w-10 h-10 rounded-full bg-white/[0.02] hover:bg-[#D4A017]/10 border border-white/10 hover:border-[#D4A017]/20 active:scale-90 text-white/40 hover:text-[#D4A017] flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
                  title="Detayları İncele"
                >
                  <span className="material-symbols-outlined text-xl">info</span>
                </Link>

                {/* BEĞEN Butonu (Sağa fırlat) */}
                <button
                  onClick={() => swipe('right')}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E50914]/20 to-[#B80710]/20 hover:from-[#E50914] hover:to-[#B80710] border border-[#E50914]/20 hover:border-transparent active:scale-90 text-[#E50914] hover:text-white flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(229,9,20,0.15)] hover:shadow-[0_4px_20px_rgba(229,9,20,0.4)]"
                  title="İzleme Listeme Ekle"
                >
                  <span className="material-symbols-outlined text-2xl">favorite</span>
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
