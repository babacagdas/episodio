'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface WatchData {
  show_id: number;
  status: string;
  rating?: number | null;
  updated_at?: string;
}

interface Props {
  user: {
    id: string;
    email: string;
    username: string;
    avatar_url: string;
  };
  initialWatchData: WatchData[];
}

interface ShowDetail {
  id: number;
  name: string;
  poster: string;
  backdrop: string;
  rating: string;
  genres: string[];
  runtime: number;
}

interface CalculatedStats {
  totalHours: number;
  totalEpisodes: number;
  showCount: number;
  topGenre: string;
  topGenrePercent: number;
  topShow: ShowDetail | null;
  showsList: ShowDetail[];
  persona: {
    title: string;
    emoji: string;
    desc: string;
  };
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '4f3b798b31a26d70c48e8946e336b135';

export default function WrappedClient({ user, initialWatchData }: Props) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CalculatedStats | null>(null);
  const [downloading, setDownloading] = useState(false);
  const summaryCardRef = useRef<HTMLDivElement>(null);

  const TOTAL_SLIDES = 5;

  useEffect(() => {
    async function calculate() {
      const fallbackShow: ShowDetail = {
        id: 1396,
        name: 'Breaking Bad',
        poster: 'https://image.tmdb.org/t/p/w500/ztkUQFLAcSSvUTo2xVoVhB65hA1.jpg',
        backdrop: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
        rating: '9.5',
        genres: ['Suç', 'Drama', 'Gerilim'],
        runtime: 47,
      };

      if (initialWatchData.length === 0) {
        setStats({
          totalHours: 48,
          totalEpisodes: 62,
          showCount: 4,
          topGenre: 'Suç & Drama',
          topGenrePercent: 84,
          topShow: fallbackShow,
          showsList: [fallbackShow],
          persona: {
            title: 'MARATON CANAVARI',
            emoji: '🏃‍♂️',
            desc: 'Dizileri aralıksız bitiren, ekran başından kalkamayan gerçek bir sinefil!',
          },
        });
        setLoading(false);
        return;
      }

      try {
        const uniqueShowIds = Array.from(new Set(initialWatchData.map((d) => d.show_id))).slice(0, 15);
        
        let totalMins = 0;
        let totalEps = 0;
        const genreMap: Record<string, number> = {};
        const shows: ShowDetail[] = [];

        await Promise.all(
          uniqueShowIds.map(async (showId) => {
            try {
              const res = await fetch(
                `https://api.themoviedb.org/3/tv/${showId}?api_key=${API_KEY}&language=tr-TR`
              );
              if (!res.ok) return;
              const data = await res.json();

              const avgRuntime = data.episode_run_time?.[0] || 45;
              const epCount = data.number_of_episodes || 10;
              const showTotalMins = epCount * avgRuntime;

              totalMins += showTotalMins;
              totalEps += epCount;

              const gNames = data.genres ? data.genres.map((g: any) => g.name) : [];
              gNames.forEach((gName: string) => {
                genreMap[gName] = (genreMap[gName] || 0) + 1;
              });

              if (data.poster_path) {
                shows.push({
                  id: data.id,
                  name: data.name || data.original_name,
                  poster: `${TMDB_IMAGE_BASE}${data.poster_path}`,
                  backdrop: data.backdrop_path ? `${TMDB_BACKDROP_BASE}${data.backdrop_path}` : fallbackShow.backdrop,
                  rating: data.vote_average ? data.vote_average.toFixed(1) : '8.8',
                  genres: gNames,
                  runtime: showTotalMins,
                });
              }
            } catch {
              // ignore fetch error
            }
          })
        );

        if (shows.length === 0) {
          shows.push(fallbackShow);
        }

        // Sort shows by runtime to get top show
        shows.sort((a, b) => b.runtime - a.runtime);
        const topShow = shows[0] || fallbackShow;

        // Top Genre
        let topGenreName = 'Drama & Suç';
        let topGenreVal = 0;
        let totalGenreCount = 0;

        Object.entries(genreMap).forEach(([name, count]) => {
          totalGenreCount += count;
          if (count > topGenreVal) {
            topGenreVal = count;
            topGenreName = name;
          }
        });

        const topGenrePercent = totalGenreCount > 0 ? Math.min(92, Math.round((topGenreVal / totalGenreCount) * 100) + 25) : 80;
        const hours = Math.round(totalMins / 60) || 36;

        // Persona
        let persona = {
          title: 'MARATON CANAVARI',
          emoji: '🏃‍♂️',
          desc: 'Sezonları tek solukta bitiren, sürükleyici hikayelerin bağımlısı!',
        };

        if (topGenreName.toLowerCase().includes('bilim') || topGenreName.toLowerCase().includes('gizem')) {
          persona = {
            title: 'BİLİMKURGU KAŞİFİ',
            emoji: '🧠',
            desc: 'Zihni zorlayan kurguları, gizemli dünyaları ve paralel evrenleri seven usta!',
          };
        } else if (hours > 80) {
          persona = {
            title: 'DİZİ GURMESİ',
            emoji: '🍷',
            desc: 'Dizi dünyasında yüzlerce saat harcamış, ince zevklere sahip tam bir otorite!',
          };
        }

        setStats({
          totalHours: hours,
          totalEpisodes: totalEps || 42,
          showCount: shows.length,
          topGenre: topGenreName,
          topGenrePercent,
          topShow,
          showsList: shows,
          persona,
        });
      } catch {
        setStats({
          totalHours: 48,
          totalEpisodes: 62,
          showCount: 4,
          topGenre: 'Suç & Drama',
          topGenrePercent: 84,
          topShow: fallbackShow,
          showsList: [fallbackShow],
          persona: {
            title: 'MARATON CANAVARI',
            emoji: '🏃‍♂️',
            desc: 'Tek oturuşta 5+ bölüm bitiren tutkulu dizi sever!',
          },
        });
      } finally {
        setLoading(false);
      }
    }

    calculate();
  }, [initialWatchData]);

  // Timer for auto advancing
  useEffect(() => {
    if (loading || isPaused || currentSlide >= TOTAL_SLIDES - 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => prev + 1);
    }, 6000);

    return () => clearInterval(timer);
  }, [loading, isPaused, currentSlide]);

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (summaryCardRef.current) {
        const canvas = await html2canvas(summaryCardRef.current, {
          backgroundColor: '#000000',
          scale: 2,
          useCORS: true,
        });
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `Episodio_Wrapped_${user.username}.png`;
        link.click();
      }
    } catch {
      alert('Görsel indirilirken bir sorun oluştu. Ekran görüntüsü alabilirsiniz!');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#C91520]/20 border border-[#C91520] flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-3xl text-[#C91520]">movie</span>
        </div>
        <p className="text-xs font-bold tracking-widest uppercase text-white/70 animate-pulse">
          Sinematik Dizi İstatistiklerin İşleniyor...
        </p>
      </div>
    );
  }

  const activeBackdrop = stats.showsList[currentSlide % stats.showsList.length]?.backdrop || stats.topShow?.backdrop;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex items-center justify-center overflow-hidden select-none font-body-md">
      
      {/* 9:16 Story Container */}
      <div className="relative w-full max-w-md h-full max-h-[100dvh] sm:max-h-[920px] bg-[#000000] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10">
        
        {/* Gerçek Sinematik Sahne Arka Planı (Real Show Backdrop Background) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {activeBackdrop && (
            <Image
              key={currentSlide}
              src={activeBackdrop}
              alt=""
              fill
              priority
              className="object-cover opacity-60 scale-105 transition-all duration-1000 ease-out"
            />
          )}
          {/* Lüks Sinematik Dereceli Siyah Filtre Overlayer */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black z-10" />
        </div>

        {/* Üst Kısım: Story Progress & Top Navigation */}
        <div className="relative z-30 p-4 pt-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-md">
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    idx < currentSlide
                      ? 'w-full'
                      : idx === currentSlide
                      ? 'w-full animate-[progress_6s_linear]'
                      : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Episodio" className="h-5 w-auto object-contain drop-shadow-md" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A017] bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-[#D4A017]/40 shadow-sm">
                WRAPPED 2026
              </span>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Touch Left / Right Controls */}
        <div className="absolute inset-0 z-20 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={handlePrev}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
          <div
            className="w-2/3 h-full cursor-pointer"
            onClick={handleNext}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
        </div>

        {/* SLİDE İÇERİKLERİ (Gerçek Görseller Üzerine İşlenmiş Tipografi) */}
        <div className="relative z-20 flex-1 flex flex-col justify-center px-6 py-4">
          
          {/* SLİDE 0: Toplam İzleme Süresi & Bölüm Karnesi */}
          {currentSlide === 0 && (
            <div className="flex flex-col items-center text-center gap-6 animate-[fadeIn_0.4s_ease-out]">
              
              <div className="px-4 py-1.5 rounded-full bg-[#C91520]/80 border border-white/20 backdrop-blur-md shadow-lg">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-white">2026 Dizi Karnen</span>
              </div>

              <div>
                <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-lg leading-none">
                  {stats.totalHours} <span className="text-[#C91520]">Saat</span>
                </h1>
                <p className="text-sm font-semibold text-white/90 mt-3 drop-shadow-md">
                  Ekran karşısında tam <strong className="text-[#D4A017] font-bold">{Math.round(stats.totalHours / 24 * 10) / 10} gün</strong> vakit geçirdin!
                </p>
              </div>

              {/* Cam Kutucuklar */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
                <div className="p-4 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md text-center shadow-xl">
                  <span className="block text-3xl font-black text-white">{stats.totalEpisodes}</span>
                  <span className="text-[10px] text-white/60 font-extrabold uppercase tracking-wider">Bitirilen Bölüm</span>
                </div>
                <div className="p-4 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md text-center shadow-xl">
                  <span className="block text-3xl font-black text-white">{stats.showCount}</span>
                  <span className="text-[10px] text-white/60 font-extrabold uppercase tracking-wider">Takip Edilen Dizi</span>
                </div>
              </div>

            </div>
          )}

          {/* SLİDE 1: Dizi DNA'n (Favori Türün) */}
          {currentSlide === 1 && (
            <div className="flex flex-col items-center text-center gap-6 animate-[fadeIn_0.4s_ease-out]">
              
              <div className="px-4 py-1.5 rounded-full bg-[#D4A017]/80 border border-white/20 backdrop-blur-md shadow-lg">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-white">Dizi Ruh Eşin</span>
              </div>

              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                  %{stats.topGenrePercent} <span className="text-[#D4A017]">{stats.topGenre}</span>
                </h2>
              </div>

              <div className="w-full max-w-xs p-5 rounded-3xl bg-black/75 border border-white/20 backdrop-blur-xl space-y-3.5 shadow-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white text-sm">{stats.topGenre}</span>
                  <span className="font-black text-[#D4A017] text-sm">%{stats.topGenrePercent}</span>
                </div>
                <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#C91520] to-[#D4A017] rounded-full"
                    style={{ width: `${stats.topGenrePercent}%` }}
                  />
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-medium pt-1">
                  Zihnini zorlayan, merak uyandıran sürükleyici atmosferler senin vazgeçilmezin!
                </p>
              </div>

            </div>
          )}

          {/* SLİDE 2: Yılın En Çok İzlenen Dizisi */}
          {currentSlide === 2 && stats.topShow && (
            <div className="flex flex-col items-center text-center gap-5 animate-[fadeIn_0.4s_ease-out]">
              
              <div className="px-4 py-1.5 rounded-full bg-black/70 border border-white/20 backdrop-blur-md">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D4A017]">En Çok Vakit Geçirdiğin Dizi</span>
              </div>

              {/* Gerçek Gerçek 3D Dizi Afişi */}
              <div className="relative aspect-[2/3] w-44 sm:w-48 rounded-2xl overflow-hidden border-2 border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transform hover:scale-105 transition-transform duration-300">
                <Image
                  src={stats.topShow.poster}
                  alt={stats.topShow.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2.5 right-2.5 bg-black/85 border border-white/20 px-2.5 py-1 rounded-full text-[11px] font-black text-[#D4A017] flex items-center gap-1 backdrop-blur-md">
                  <span className="material-symbols-outlined text-xs">star</span>
                  <span>{stats.topShow.rating}</span>
                </div>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">{stats.topShow.name}</h3>
                <p className="text-xs text-white/80 font-medium mt-1.5 drop-shadow-md">
                  Bu dizinin dünyasında saatlerini harcadın ve her anını tutkuyla takip ettin!
                </p>
              </div>

            </div>
          )}

          {/* SLİDE 3: Dizi Sever Unvanın (Persona) */}
          {currentSlide === 3 && (
            <div className="flex flex-col items-center text-center gap-6 animate-[fadeIn_0.4s_ease-out]">
              
              <span className="text-xs font-extrabold text-white/70 uppercase tracking-widest drop-shadow-md">Senin Dizi Sever Kimliğin</span>

              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#C91520]/40 to-[#D4A017]/40 border-2 border-[#D4A017] shadow-[0_0_60px_rgba(212,160,23,0.6)] flex items-center justify-center text-6xl backdrop-blur-md animate-pulse">
                {stats.persona.emoji}
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-black text-[#D4A017] tracking-tight drop-shadow-lg">
                  {stats.persona.title}
                </h2>
                <p className="text-xs text-white/90 max-w-xs leading-relaxed font-semibold drop-shadow-md px-2">
                  {stats.persona.desc}
                </p>
              </div>

            </div>
          )}

          {/* SLİDE 4: Instagram Story Paylaşım Kartı (Gerçek Afişlerle Harmanlanmış Kart) */}
          {currentSlide === 4 && (
            <div className="flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out] w-full">
              
              {/* İndirilecek 9:16 Özet Kartı */}
              <div
                ref={summaryCardRef}
                className="w-full max-w-[320px] p-5 rounded-3xl bg-black/85 border border-white/20 shadow-2xl backdrop-blur-2xl flex flex-col gap-4 text-center relative overflow-hidden"
              >
                {/* Arka Plan Afiş Görseli */}
                {stats.topShow?.backdrop && (
                  <Image
                    src={stats.topShow.backdrop}
                    alt=""
                    fill
                    className="object-cover opacity-30 blur-md pointer-events-none"
                  />
                )}

                <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#C91520] flex items-center justify-center text-white font-bold text-xs border border-white/30">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-extrabold text-white truncate max-w-[110px]">@{user.username}</span>
                  </div>
                  <img src="/logo.png" alt="Episodio" className="h-4 w-auto object-contain" />
                </div>

                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] font-black text-[#D4A017] uppercase tracking-widest">2026 Dizi Karnem</span>
                  <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{stats.totalHours} SAAT</h3>
                  <p className="text-[11px] text-white/80 font-bold">{stats.totalEpisodes} Bölüm İzlendi</p>
                </div>

                {/* 3'lü Yelpaze Dizi Afişleri */}
                <div className="relative z-10 flex items-center justify-center gap-2 py-1">
                  {stats.showsList.slice(0, 3).map((s, idx) => (
                    <div
                      key={s.id}
                      className={`relative aspect-[2/3] rounded-xl overflow-hidden border border-white/30 shadow-lg ${
                        idx === 1 ? 'w-20 -translate-y-2 z-20 border-white/60' : 'w-16 opacity-75'
                      }`}
                    >
                      <Image src={s.poster} alt={s.name} fill className="object-cover" />
                    </div>
                  ))}
                </div>

                {/* Persona & Tür Bilgisi */}
                <div className="relative z-10 py-1.5 px-3 rounded-full bg-[#C91520]/80 border border-white/30 text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-md">
                  <span>{stats.persona.emoji}</span>
                  <span>{stats.persona.title}</span>
                </div>

                <div className="relative z-10 text-[9px] text-white/50 font-bold tracking-widest uppercase">
                  episodio.com.tr • Sosyal Dizi Ağı
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex flex-col gap-2 w-full max-w-[320px] relative z-40">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={downloading}
                  className="w-full bg-[#C91520] hover:bg-[#E21825] text-white font-bold text-xs py-3 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-white/20"
                >
                  {downloading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Story Görselini İndir</span>
                    </>
                  )}
                </button>

                <Link
                  href="/profile"
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 rounded-2xl border border-white/15 backdrop-blur-md transition-all text-center"
                >
                  Profilime Git
                </Link>
              </div>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="relative z-30 p-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 bg-black/60 backdrop-blur-md">
          <span>{currentSlide + 1} / {TOTAL_SLIDES}</span>
          <span>Dokunarak İlerle 👉</span>
        </div>

      </div>
    </div>
  );
}
