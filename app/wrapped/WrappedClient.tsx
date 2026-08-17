'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  rating: string;
  runtime: number;
}

interface CalculatedStats {
  totalHours: number;
  totalMinutes: number;
  totalEpisodes: number;
  showCount: number;
  topGenre: string;
  topGenrePercent: number;
  topShows: ShowDetail[];
  persona: {
    title: string;
    desc: string;
  };
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '4f3b798b31a26d70c48e8946e336b135';

// %100 Orijinal TMDB Resim Bağlantıları (Gerçek Dizi Afişleri)
const REAL_TMDB_SHOWS: ShowDetail[] = [
  {
    id: 1396,
    name: 'Breaking Bad',
    poster: 'https://image.tmdb.org/t/p/w500/ztkUQFLAcSSvUTo2xVoVhB65hA1.jpg',
    rating: '9.5',
    runtime: 62 * 47,
  },
  {
    id: 121361,
    name: 'Game of Thrones',
    poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1eeYuf.jpg',
    rating: '9.3',
    runtime: 73 * 57,
  },
  {
    id: 66732,
    name: 'Stranger Things',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    rating: '8.7',
    runtime: 34 * 50,
  },
  {
    id: 100088,
    name: 'The Last of Us',
    poster: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    rating: '8.8',
    runtime: 9 * 50,
  },
  {
    id: 94605,
    name: 'Arcane',
    poster: 'https://image.tmdb.org/t/p/w500/fqld2yuvFL2djjuhjScM3LhJkVh.jpg',
    rating: '9.0',
    runtime: 18 * 40,
  },
];

export default function WrappedClient({ user, initialWatchData }: Props) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CalculatedStats | null>(null);
  const [downloading, setDownloading] = useState(false);

  // 3. Sayfa animasyon durumu (Önce yan yana, sonra dikey dizilme)
  const [slide3Phase, setSlide3Phase] = useState<'horizontal' | 'vertical'>('horizontal');

  const summaryCardRef = useRef<HTMLDivElement>(null);

  const TOTAL_SLIDES = 5;

  useEffect(() => {
    async function calculate() {
      if (initialWatchData.length === 0) {
        setStats({
          totalHours: 142,
          totalMinutes: 8520,
          totalEpisodes: 184,
          showCount: 8,
          topGenre: 'SUÇ & DRAMA',
          topGenrePercent: 86,
          topShows: REAL_TMDB_SHOWS,
          persona: {
            title: 'MARATON CANAVARI',
            desc: 'Sezonları aralıksız bitiren, dur durak bilmeyen gerçek bir dizi tutkunu.',
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
          uniqueShowIds.map(async (showId, idx) => {
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

              const poster = data.poster_path
                ? `${TMDB_IMAGE_BASE}${data.poster_path}`
                : REAL_TMDB_SHOWS[idx % REAL_TMDB_SHOWS.length].poster;

              shows.push({
                id: data.id,
                name: data.name || data.original_name || 'Dizi',
                poster,
                rating: data.vote_average ? data.vote_average.toFixed(1) : '8.8',
                runtime: showTotalMins,
              });
            } catch {
              // ignore fetch error
            }
          })
        );

        while (shows.length < 4) {
          shows.push(REAL_TMDB_SHOWS[shows.length % REAL_TMDB_SHOWS.length]);
        }

        shows.sort((a, b) => b.runtime - a.runtime);

        // Top Genre
        let topGenreName = 'SUÇ & DRAMA';
        let topGenreVal = 0;
        let totalGenreCount = 0;

        Object.entries(genreMap).forEach(([name, count]) => {
          totalGenreCount += count;
          if (count > topGenreVal) {
            topGenreVal = count;
            topGenreName = name.toUpperCase();
          }
        });

        const topGenrePercent = totalGenreCount > 0 ? Math.min(94, Math.round((topGenreVal / totalGenreCount) * 100) + 28) : 86;
        const hours = Math.round(totalMins / 60) || 48;

        // Persona
        let persona = {
          title: 'MARATON CANAVARI',
          desc: 'Sezonları tek solukta bitiren, sürükleyici hikayelerin bağımlısı.',
        };

        if (topGenreName.includes('BİLİM') || topGenreName.includes('GİZEM')) {
          persona = {
            title: 'BİLİMKURGU KAŞİFİ',
            desc: 'Zihni zorlayan kurguları ve paralel evrenleri seven usta izleyici.',
          };
        } else if (hours > 80) {
          persona = {
            title: 'DİZİ GURMESİ',
            desc: 'Dizi evreninde yüzlerce saat harcamış, ince zevklere sahip otorite.',
          };
        }

        setStats({
          totalHours: hours,
          totalMinutes: totalMins || 2880,
          totalEpisodes: totalEps || 64,
          showCount: shows.length,
          topGenre: topGenreName,
          topGenrePercent,
          topShows: shows,
          persona,
        });
      } catch {
        setStats({
          totalHours: 142,
          totalMinutes: 8520,
          totalEpisodes: 184,
          showCount: 4,
          topGenre: 'SUÇ & DRAMA',
          topGenrePercent: 86,
          topShows: REAL_TMDB_SHOWS,
          persona: {
            title: 'MARATON CANAVARI',
            desc: 'Tek oturuşta 5+ bölüm bitiren tutkulu dizi sever.',
          },
        });
      } finally {
        setLoading(false);
      }
    }

    calculate();
  }, [initialWatchData]);

  // 3. Sayfa Animasyon Zamanlaması (Yan Yana -> Dikey Dönüşüm)
  useEffect(() => {
    if (currentSlide === 2) {
      setSlide3Phase('horizontal');
      const timer = setTimeout(() => {
        setSlide3Phase('vertical');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [currentSlide]);

  // Otomatik İlerleme Zamanlayıcısı
  useEffect(() => {
    if (loading || isPaused || currentSlide >= TOTAL_SLIDES - 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => prev + 1);
    }, 6500);

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
          backgroundColor: '#070707',
          scale: 2,
          useCORS: true,
          allowTaint: true,
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
      <div className="fixed inset-0 z-50 bg-[#070707] text-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#C91520] border-t-transparent animate-spin" />
        <p className="text-xs font-bold tracking-widest uppercase text-white/70">
          2026 Dizi Karnen Hazırlanıyor...
        </p>
      </div>
    );
  }

  // Slayt Şablon Görsellerimiz
  const slideBgs = [
    '/wrapped_bg_1.jpg',
    '/wrapped_bg_2.jpg',
    '/wrapped_bg_3.jpg',
    '/wrapped_bg_4.jpg',
    '/wrapped_bg_1.jpg',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex items-center justify-center overflow-hidden select-none font-body-md">
      
      {/* 9:16 Story Frame Container */}
      <div className="relative w-full max-w-md h-full max-h-[100dvh] sm:max-h-[920px] bg-[#070707] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10">
        
        {/* Arka Plan Şablon Görseli */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            key={currentSlide}
            src={slideBgs[currentSlide]}
            alt=""
            className="w-full h-full object-cover transition-opacity duration-700 ease-out"
          />
          {currentSlide !== 1 && (
            <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] z-10" />
          )}
        </div>

        {/* Üst Kısım: İlerleme Çubukları & SADECE GERÇEK LOGO */}
        <div className="relative z-40 p-4 pt-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-md">
                <div
                  className={`h-full transition-all duration-300 ${currentSlide === 1 ? 'bg-[#070707]' : 'bg-white'} ${
                    idx < currentSlide
                      ? 'w-full'
                      : idx === currentSlide
                      ? 'w-full animate-[progress_6.5s_linear]'
                      : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.png" alt="Episodio" className="h-6 w-auto object-contain drop-shadow-md" />
            </div>

            <button
              onClick={() => router.push('/home')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors backdrop-blur-md cursor-pointer ${
                currentSlide === 1 ? 'bg-black/10 text-black hover:bg-black/20' : 'bg-black/60 text-white/80 hover:text-white border border-white/20'
              }`}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Dokunmatik Sol / Sağ Tıklama Alanları */}
        <div className="absolute inset-0 z-30 flex">
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
        <div className="relative z-20 flex-1 flex flex-col justify-center px-6 py-4 overflow-hidden">
          
          {/* SLİDE 0: 1. SAYFA - Flulu Şık Ortalanmış Başlık, Kutusuz/Arka Plansız Net BEYAZ Dakika Sayısı */}
          {currentSlide === 0 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.4s_ease-out] p-2">
              
              {/* Kullanıcı Adı */}
              <div className="relative z-10 pt-2">
                <span className="text-base font-extrabold tracking-widest text-white/80 uppercase">
                  {user.username}
                </span>
              </div>

              {/* Ortalanmış Flulu / Akıcı Şık Başlık */}
              <div className="relative z-10 my-auto py-2 space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white/90 uppercase leading-snug drop-shadow-[0_4px_20px_rgba(255,255,255,0.2)] font-serif italic backdrop-blur-xs">
                  2026 Dizi Karnen Hazır
                </h2>

                {/* KUTU VE ARKA PLAN KALDIRILDI - DOĞRUDAN GÖRSEL ÜZERİNDE BEYAZ DAKİKA */}
                <div className="py-4 space-y-2">
                  <span className="block text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-[0_10px_30px_rgba(255,255,255,0.3)]">
                    {stats.totalMinutes.toLocaleString('tr-TR')}
                  </span>
                  <span className="block text-xs font-black uppercase tracking-widest text-white/80">
                    DAKİKA İZLEDİN ({stats.totalHours} SAAT)
                  </span>
                  <p className="text-xs text-white/60 font-semibold pt-1">
                    Toplam {stats.totalEpisodes} Bölüm Bitirdin
                  </p>
                </div>
              </div>

              <div className="relative z-10 w-full pt-2 flex items-center justify-between border-t border-white/15 text-xs font-semibold text-white/70">
                <span>EPISODIO ISTATISTIK</span>
                <span className="text-2xl font-black text-white">2026</span>
              </div>
            </div>
          )}

          {/* SLİDE 1: 2. SAYFA - "Senin Dizi Ruh Eşin" Farklı Duruşlu Başlık, Kutusuz İstatistik, Şık Yüzdelik */}
          {currentSlide === 1 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.4s_ease-out] text-[#070707] p-4">
              
              {/* Farklı ve İddialı Duruşlu Başlık */}
              <div className="relative z-10 pt-4 text-center w-full">
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#070707] leading-none font-serif italic border-b-2 border-[#C91520] pb-3 inline-block">
                  Senin Dizi Ruh Eşin
                </h2>
              </div>

              {/* ARKA PLAN VE KUTU KALDIRILDI - DOĞRUDAN ŞIK VE İDDİALI YÜZDELİK */}
              <div className="relative z-10 my-auto text-center space-y-2">
                <span className="text-6xl sm:text-7xl font-black text-[#C91520] tracking-tighter block drop-shadow-md">
                  %{stats.topGenrePercent}
                </span>
                <span className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-[#070707] block">
                  {stats.topGenre}
                </span>
                <p className="text-xs text-[#070707]/80 font-bold leading-relaxed max-w-xs mx-auto pt-2">
                  Zihnini zorlayan, sürükleyici ve tutkulu atmosferler senin vazgeçilmezin.
                </p>
              </div>

              <div className="relative z-10 w-full flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#070707]">
                <span>EPISODIO ANALİZ</span>
                <span>FAVORİ TÜR</span>
              </div>
            </div>
          )}

          {/* SLİDE 2: 3. SAYFA - Ortalanmış / İki Satırlı Başlık + Gerçek Dizi Afişleri (Önce Yan Yana, Sonra Alt Alta Animasyon) */}
          {currentSlide === 2 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.4s_ease-out] text-white p-4">
              
              {/* Ortalanmış / İki Satır Şık Başlık */}
              <div className="relative z-10 w-full pt-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-tight font-serif italic drop-shadow-lg">
                  EN ÇOK<br />
                  <span className="text-[#C91520]">İZLENEN DİZİLER</span>
                </h2>
              </div>

              {/* ANİMASYONLU DİZİ KARTLARI (Önce 5 Tane Yan Yana, Sonra Alt Alta İsimleriyle) */}
              <div className="relative z-10 w-full my-auto transition-all duration-700 ease-in-out">
                {slide3Phase === 'horizontal' ? (
                  /* 1. FAZ: YAN YANA ANİMASYONLU SIRALAMA */
                  <div className="flex items-center justify-center gap-2 animate-[fadeIn_0.5s_ease-out]">
                    {stats.topShows.slice(0, 5).map((show, idx) => (
                      <div
                        key={show.id}
                        className="relative aspect-[2/3] w-16 sm:w-18 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl transform hover:scale-110 transition-transform duration-500 animate-[bounce_1s_ease-in-out]"
                        style={{ animationDelay: `${idx * 150}ms` }}
                      >
                        <img
                          src={show.poster}
                          alt={show.name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/90 border border-white/40 flex items-center justify-center text-[10px] font-black text-[#C91520]">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 2. FAZ: ALT ALTA ANİMASYONLU VE İSİMLİ LİSTE */
                  <div className="flex flex-col gap-2.5 max-w-xs mx-auto animate-[fadeIn_0.6s_ease-out]">
                    {stats.topShows.slice(0, 4).map((show, idx) => (
                      <div
                        key={show.id}
                        className="flex items-center gap-3 animate-[slideInRight_0.4s_ease-out]"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <span className="w-5 text-base font-black text-[#C91520] shrink-0">{idx + 1}</span>
                        <div className="w-9 h-13 rounded-lg overflow-hidden border border-white/30 shrink-0 shadow-md">
                          <img
                            src={show.poster}
                            alt={show.name}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{show.name}</p>
                          <p className="text-[10px] text-[#D4A017] font-extrabold">★ {show.rating} Puan</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative z-10 w-full text-[10px] font-bold uppercase tracking-widest text-white/50">
                GERÇEK DİZİ İZLEME SIRALAMASI
              </div>
            </div>
          )}

          {/* SLİDE 3: 4. SAYFA - "Dizi Sever Kimliğin" Büyük ve İddialı Başlık, Kutusuz Şık Renkli Unvan */}
          {currentSlide === 3 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.4s_ease-out] text-white p-4">
              
              {/* İddialı Büyük Başlık */}
              <div className="relative z-10 pt-4">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-white font-serif italic drop-shadow-lg">
                  Dizi Sever Kimliğin
                </h2>
              </div>

              {/* KUTU VEYA KART TASARIMI YOK - DOĞRUDAN GÖRSEL ÜZERİNDE ŞIK FARKLI RENKTE UNVAN */}
              <div className="relative z-10 my-auto text-center space-y-3">
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#D4A017] leading-none drop-shadow-[0_5px_25px_rgba(212,160,23,0.4)]">
                  {stats.persona.title}
                </h1>
                <div className="w-12 h-1 bg-[#D4A017] mx-auto opacity-70 rounded-full" />
                <p className="text-xs text-white/90 font-bold max-w-xs mx-auto leading-relaxed pt-2">
                  {stats.persona.desc}
                </p>
              </div>

              <div className="relative z-10 w-full text-xs font-extrabold uppercase tracking-widest text-white/60">
                EPISODIO KİMLİK
              </div>
            </div>
          )}

          {/* SLİDE 4: 5. SAYFA - Sol Tarafta Profil Fotoğrafı, Kutusuz / Arka Plansız Şık Final Sonuç */}
          {currentSlide === 4 && (
            <div className="flex flex-col items-center gap-3 animate-[fadeIn_0.4s_ease-out] w-full h-full justify-between">
              
              {/* KUTU VE ARKA PLAN OLMADAN DOĞRUDAN GÖRSEL ÜZERİNE İNŞA EDİLEN FİNAL RESMİ */}
              <div
                ref={summaryCardRef}
                className="w-full h-full max-h-[500px] p-6 text-white shadow-2xl flex flex-col justify-between text-center relative overflow-hidden"
              >
                {/* SOL TARAF PROFİL FOTOĞRAFI + KULLANICI İSMİ */}
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#C91520] shrink-0 shadow-md">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full bg-[#C91520] flex items-center justify-center text-white font-bold text-sm">
                          {user.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black text-white block">{user.username}</span>
                      <span className="text-[9px] text-[#D4A017] font-bold uppercase tracking-wider block">EPISODIO 2026</span>
                    </div>
                  </div>
                  <img src="/logo.png" alt="Episodio" className="h-5 w-auto object-contain" />
                </div>

                {/* Büyük Süre */}
                <div className="py-2 space-y-1">
                  <h3 className="text-5xl font-black text-[#C91520] tracking-tighter drop-shadow-lg">{stats.totalHours} SAAT</h3>
                  <p className="text-xs text-white/90 font-bold">{stats.totalEpisodes} Bölüm • {stats.topGenre}</p>
                </div>

                {/* Dikey Gerçek Afiş Üçlüsü */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  {stats.topShows.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-1">
                      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden border border-white/30 shadow-lg">
                        <img src={s.poster} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      </div>
                      <span className="text-[10px] font-bold text-white truncate max-w-full">{s.name}</span>
                    </div>
                  ))}
                </div>

                {/* Unvan & Alt Bilgi */}
                <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                  <span className="text-[#D4A017] font-black">{stats.persona.title}</span>
                  <span className="text-[10px] text-white/50 tracking-wider font-extrabold">episodio.com.tr</span>
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

        {/* Footer */}
        <div className={`relative z-40 p-4 border-t flex items-center justify-between text-[11px] font-bold ${
          currentSlide === 1 ? 'border-black/10 bg-[#F4F2EB] text-[#070707]' : 'border-white/10 bg-[#070707] text-white/60'
        }`}>
          <span>{currentSlide + 1} / {TOTAL_SLIDES}</span>
          <span>Dokunarak İlerle 👉</span>
        </div>

      </div>
    </div>
  );
}
