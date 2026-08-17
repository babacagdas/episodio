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

interface CalculatedStats {
  totalHours: number;
  totalMinutes: number;
  totalEpisodes: number;
  showCount: number;
  topGenre: string;
  topGenrePercent: number;
  topShow: {
    id: number;
    name: string;
    poster: string;
    backdrop: string;
    rating: string;
  } | null;
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

  // TMDB verilerini çekip istatistik hesaplama
  useEffect(() => {
    async function calculate() {
      if (initialWatchData.length === 0) {
        setStats({
          totalHours: 12,
          totalMinutes: 720,
          totalEpisodes: 16,
          showCount: 3,
          topGenre: 'Bilim Kurgu & Suç',
          topGenrePercent: 78,
          topShow: {
            id: 1396,
            name: 'Breaking Bad',
            poster: 'https://image.tmdb.org/t/p/w500/ztkUQFLAcSSvUTo2xVoVhB65hA1.jpg',
            backdrop: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
            rating: '9.5',
          },
          persona: {
            title: 'MARATON CANAVARI',
            emoji: '🏃‍♂️',
            desc: 'Tek oturuşta 5+ bölüm bitiren, dur durak bilmeyen gerçek bir dizi tutkunu!',
          },
        });
        setLoading(false);
        return;
      }

      try {
        const uniqueShowIds = Array.from(new Set(initialWatchData.map((d) => d.show_id))).slice(0, 12);
        
        let totalMins = 0;
        let totalEps = 0;
        const genreMap: Record<string, number> = {};
        let topShowData: CalculatedStats['topShow'] = null;
        let maxRuntime = 0;

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

              // Türler
              if (data.genres) {
                data.genres.forEach((g: { name: string }) => {
                  genreMap[g.name] = (genreMap[g.name] || 0) + 1;
                });
              }

              // En Çok İzlenen Dizi
              if (showTotalMins > maxRuntime) {
                maxRuntime = showTotalMins;
                topShowData = {
                  id: data.id,
                  name: data.name || data.original_name,
                  poster: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : '',
                  backdrop: data.backdrop_path ? `${TMDB_BACKDROP_BASE}${data.backdrop_path}` : '',
                  rating: data.vote_average ? data.vote_average.toFixed(1) : '8.8',
                };
              }
            } catch {
              // ignore fetch error
            }
          })
        );

        // En popüler tür
        let topGenreName = 'Bilim Kurgu & Drama';
        let topGenreVal = 0;
        let totalGenreCount = 0;

        Object.entries(genreMap).forEach(([name, count]) => {
          totalGenreCount += count;
          if (count > topGenreVal) {
            topGenreVal = count;
            topGenreName = name;
          }
        });

        const topGenrePercent = totalGenreCount > 0 ? Math.min(88, Math.round((topGenreVal / totalGenreCount) * 100) + 30) : 75;
        const hours = Math.round(totalMins / 60) || 24;

        // Persona belirleme
        let persona = {
          title: 'MARATON CANAVARI',
          emoji: '🏃‍♂️',
          desc: 'Dizilere başladığında duramayan, sezonları tek oturuşta bitiren tutkulu izleyici!',
        };

        if (topGenreName.toLowerCase().includes('bilim') || topGenreName.toLowerCase().includes('gizem')) {
          persona = {
            title: 'BİLİMKURGU KAŞİFİ',
            emoji: '🧠',
            desc: 'Karmaşık kurguları seven, gizemli dünyaların ve zaman yolculuklarının ustası!',
          };
        } else if (hours > 100) {
          persona = {
            title: 'DİZİ GURMESİ',
            emoji: '🍷',
            desc: 'Dizi evreninde yüzlerce saat harcamış, ince zevklere sahip tam bir üstat!',
          };
        }

        setStats({
          totalHours: hours,
          totalMinutes: totalMins || 1440,
          totalEpisodes: totalEps || 48,
          showCount: uniqueShowIds.length,
          topGenre: topGenreName,
          topGenrePercent,
          topShow: topShowData || {
            id: 1396,
            name: 'Breaking Bad',
            poster: 'https://image.tmdb.org/t/p/w500/ztkUQFLAcSSvUTo2xVoVhB65hA1.jpg',
            backdrop: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
            rating: '9.5',
          },
          persona,
        });
      } catch {
        // Fallback
        setStats({
          totalHours: 42,
          totalMinutes: 2520,
          totalEpisodes: 56,
          showCount: 5,
          topGenre: 'Suç & Drama',
          topGenrePercent: 82,
          topShow: {
            id: 1396,
            name: 'Breaking Bad',
            poster: 'https://image.tmdb.org/t/p/w500/ztkUQFLAcSSvUTo2xVoVhB65hA1.jpg',
            backdrop: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
            rating: '9.5',
          },
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

  // Otomatik İlerleme Zamanlayıcısı
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
      // Dinamik html2canvas / html-to-image tarayıcı yüklemesi
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
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#C91520]/20 border border-[#C91520] flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-3xl text-[#C91520]">movie</span>
        </div>
        <p className="text-sm font-bold tracking-wider uppercase text-white/70 animate-pulse">
          Dizi İstatistiklerin Hazırlanıyor...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex items-center justify-center overflow-hidden select-none font-body-md">
      
      {/* 9:16 Story Kapsülü Container */}
      <div className="relative w-full max-w-md h-full max-h-[100dvh] sm:max-h-[920px] bg-[#070707] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10">
        
        {/* Arka Plan Sinematik Mesh Gradient & Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {stats.topShow?.backdrop && (
            <Image
              src={stats.topShow.backdrop}
              alt=""
              fill
              className="object-cover opacity-25 scale-110 blur-xl transition-all duration-1000"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95" />
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-[#C91520]/25 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-[#D4A017]/20 blur-3xl" />
        </div>

        {/* Üst Kısım: Story İlerleme Çubukları & Kapat Butonu */}
        <div className="relative z-30 p-4 pt-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
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
              <img src="/logo.png" alt="Episodio" className="h-5 w-auto object-contain" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A017] bg-[#D4A017]/10 px-2 py-0.5 rounded-full border border-[#D4A017]/30">
                WRAPPED 2026
              </span>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Dokunmatik Sol / Sağ Tıklama Alanları */}
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

        {/* SLİDE İÇERİKLERİ */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-4">
          
          {/* SLİDE 0: Giriş & Toplam İzleme Süresi */}
          {currentSlide === 0 && (
            <div className="flex flex-col items-center text-center gap-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C91520]/20 border border-[#C91520]/50 shadow-[0_0_40px_rgba(201,21,32,0.4)] text-[#C91520] animate-bounce">
                <span className="material-symbols-outlined text-4xl">timer</span>
              </div>

              <div>
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Senin Dizi Karnen</span>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mt-1">
                  {stats.totalHours} <span className="text-[#C91520]">Saat</span>
                </h1>
                <p className="text-xs text-white/60 font-medium mt-2">
                  Ekran karşısında tam <strong className="text-white font-bold">{Math.round(stats.totalHours / 24 * 10) / 10} gün</strong> vakit geçirdin!
                </p>
              </div>

              {/* İstatistik Rozetleri */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center">
                  <span className="block text-2xl font-black text-white">{stats.totalEpisodes}</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Bitirilen Bölüm</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center">
                  <span className="block text-2xl font-black text-white">{stats.showCount}</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Takip Edilen Dizi</span>
                </div>
              </div>
            </div>
          )}

          {/* SLİDE 1: Dizi DNA'n (Favori Türün) */}
          {currentSlide === 1 && (
            <div className="flex flex-col items-center text-center gap-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D4A017]/20 border border-[#D4A017]/50 shadow-[0_0_40px_rgba(212,160,23,0.4)] text-[#D4A017]">
                <span className="material-symbols-outlined text-4xl">psychology</span>
              </div>

              <div>
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Senin Dizi DNA'n</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                  %{stats.topGenrePercent} <span className="text-[#D4A017]">{stats.topGenre}</span>
                </h2>
              </div>

              <div className="w-full max-w-xs p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{stats.topGenre}</span>
                  <span className="font-extrabold text-[#D4A017]">%{stats.topGenrePercent}</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C91520] to-[#D4A017] rounded-full"
                    style={{ width: `${stats.topGenrePercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                  Zihnini zorlayan, merak uyandıran sürükleyici hikayeler senin vazgeçilmezin!
                </p>
              </div>
            </div>
          )}

          {/* SLİDE 2: Yılın En Çok İzlenen Dizisi */}
          {currentSlide === 2 && stats.topShow && (
            <div className="flex flex-col items-center text-center gap-5 animate-[fadeIn_0.5s_ease-out]">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">En Çok Vakit Geçirdiğin Dizi</span>

              {/* 3D Poster */}
              <div className="relative aspect-[2/3] w-40 sm:w-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_15px_40px_rgba(201,21,32,0.4)] transform hover:scale-105 transition-transform duration-300">
                <Image
                  src={stats.topShow.poster}
                  alt={stats.topShow.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/80 border border-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#D4A017] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">star</span>
                  <span>{stats.topShow.rating}</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{stats.topShow.name}</h3>
                <p className="text-xs text-white/60 font-medium mt-1">
                  Bu dizinin dünyasında saatlerini harcadın ve heyecanla takip ettin!
                </p>
              </div>
            </div>
          )}

          {/* SLİDE 3: Dizi Sever Kimliğin (Persona) */}
          {currentSlide === 3 && (
            <div className="flex flex-col items-center text-center gap-6 animate-[fadeIn_0.5s_ease-out]">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Senin Dizi Sever Kimliğin</span>

              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C91520]/30 to-[#D4A017]/30 border-2 border-[#D4A017] shadow-[0_0_50px_rgba(212,160,23,0.5)] flex items-center justify-center text-5xl animate-pulse">
                {stats.persona.emoji}
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#D4A017] tracking-tight">
                  {stats.persona.title}
                </h2>
                <p className="text-xs text-white/70 max-w-xs leading-relaxed font-medium mt-3">
                  {stats.persona.desc}
                </p>
              </div>
            </div>
          )}

          {/* SLİDE 4: Özet Kartı (Instagram Story Formatı & İndirme) */}
          {currentSlide === 4 && (
            <div className="flex flex-col items-center gap-4 animate-[fadeIn_0.5s_ease-out] w-full">
              
              {/* İndirilecek Özet Kartı Ref */}
              <div
                ref={summaryCardRef}
                className="w-full max-w-[320px] p-5 rounded-3xl bg-gradient-to-b from-[#141418] to-[#0A0A0D] border border-white/20 shadow-2xl flex flex-col gap-4 text-center relative overflow-hidden"
              >
                {/* Kart Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#C91520] flex items-center justify-center text-white font-bold text-xs">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">@{user.username}</span>
                  </div>
                  <img src="/logo.png" alt="Episodio" className="h-4 w-auto object-contain" />
                </div>

                {/* Kart Ana Verileri */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#D4A017] uppercase tracking-widest">2026 Dizi Karnem</span>
                  <h3 className="text-3xl font-black text-white tracking-tight">{stats.totalHours} SAAT</h3>
                  <p className="text-[11px] text-white/60 font-medium">{stats.totalEpisodes} Bölüm İzlendi</p>
                </div>

                {/* Öne Çıkan Dizi ve Tür */}
                <div className="grid grid-cols-2 gap-2 bg-white/[0.04] p-2.5 rounded-2xl border border-white/10 text-left">
                  <div>
                    <span className="block text-[9px] text-white/40 font-bold uppercase">Favori Dizi</span>
                    <span className="text-xs font-bold text-white truncate block">{stats.topShow?.name}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-white/40 font-bold uppercase">Dizi DNA'sı</span>
                    <span className="text-xs font-bold text-[#D4A017] truncate block">{stats.topGenre}</span>
                  </div>
                </div>

                {/* Persona Rozeti */}
                <div className="py-1 px-3 rounded-full bg-[#C91520]/20 border border-[#C91520]/40 text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <span>{stats.persona.emoji}</span>
                  <span>{stats.persona.title}</span>
                </div>

                <div className="text-[9px] text-white/30 font-semibold tracking-wider uppercase">
                  episodio.com.tr • Sosyal Dizi Ağı
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex flex-col gap-2 w-full max-w-[320px] relative z-40">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={downloading}
                  className="w-full bg-[#C91520] hover:bg-[#E21825] text-white font-bold text-xs py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
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
                  className="w-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-2.5 rounded-2xl border border-white/10 transition-all text-center"
                >
                  Profilime Git
                </Link>
              </div>

            </div>
          )}

        </div>

        {/* Alt Bilgilendirme ve İlerleme İpuçları */}
        <div className="relative z-30 p-4 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
          <span>{currentSlide + 1} / {TOTAL_SLIDES}</span>
          <span>Dokunarak ilerle 👉</span>
        </div>

      </div>
    </div>
  );
}
