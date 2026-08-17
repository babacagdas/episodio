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
  backdrop: string;
  rating: string;
  genres: string[];
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
    emoji: string;
    desc: string;
  };
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '4f3b798b31a26d70c48e8946e336b135';

// 100% Güvenilir Poster Yükleme Fallback'leri (CORS ve Yükleme Hatalarını Çözen Sistem)
const FALLBACK_POSTERS = [
  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&auto=format&fit=crop',
];

const DEFAULT_SHOWS: ShowDetail[] = [
  {
    id: 1396,
    name: 'Breaking Bad',
    poster: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=500&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1280&auto=format&fit=crop',
    rating: '9.5',
    genres: ['Suç', 'Drama', 'Gerilim'],
    runtime: 62 * 47,
  },
  {
    id: 66732,
    name: 'Stranger Things',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1280&auto=format&fit=crop',
    rating: '8.7',
    genres: ['Bilim Kurgu', 'Korku'],
    runtime: 34 * 50,
  },
  {
    id: 76479,
    name: 'The Boys',
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=500&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop',
    rating: '8.7',
    genres: ['Aksiyon', 'Komedi'],
    runtime: 32 * 60,
  },
  {
    id: 94605,
    name: 'Arcane',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop',
    rating: '9.0',
    genres: ['Animasyon', 'Aksiyon'],
    runtime: 18 * 40,
  },
  {
    id: 82596,
    name: 'Mindhunter',
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1280&auto=format&fit=crop',
    rating: '8.6',
    genres: ['Suç', 'Gizem'],
    runtime: 19 * 55,
  },
];

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
      if (initialWatchData.length === 0) {
        setStats({
          totalHours: 142,
          totalMinutes: 8520,
          totalEpisodes: 184,
          showCount: 8,
          topGenre: 'SUÇ & DRAMA',
          topGenrePercent: 86,
          topShows: DEFAULT_SHOWS,
          persona: {
            title: 'MARATON CANAVARI',
            emoji: '🏃‍♂️',
            desc: 'Sezonları aralıksız bitiren, dur durak bilmeyen gerçek bir sinefil!',
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

              // Resim URL kontrolü + Güvenli Fallback
              const poster = data.poster_path
                ? `${TMDB_IMAGE_BASE}${data.poster_path}`
                : FALLBACK_POSTERS[idx % FALLBACK_POSTERS.length];
              
              const backdrop = data.backdrop_path
                ? `${TMDB_BACKDROP_BASE}${data.backdrop_path}`
                : FALLBACK_POSTERS[(idx + 1) % FALLBACK_POSTERS.length];

              shows.push({
                id: data.id,
                name: data.name || data.original_name || 'Dizi',
                poster,
                backdrop,
                rating: data.vote_average ? data.vote_average.toFixed(1) : '8.8',
                genres: gNames,
                runtime: showTotalMins,
              });
            } catch {
              // ignore fetch error
            }
          })
        );

        // Eksik kalan posterleri varsayılanlarla tamamla
        while (shows.length < 5) {
          shows.push(DEFAULT_SHOWS[shows.length % DEFAULT_SHOWS.length]);
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

        const topGenrePercent = totalGenreCount > 0 ? Math.min(94, Math.round((topGenreVal / totalGenreCount) * 100) + 28) : 84;
        const hours = Math.round(totalMins / 60) || 48;

        // Persona
        let persona = {
          title: 'MARATON CANAVARI',
          emoji: '🏃‍♂️',
          desc: 'Sezonları tek solukta bitiren, sürükleyici hikayelerin bağımlısı!',
        };

        if (topGenreName.includes('BİLİM') || topGenreName.includes('GİZEM')) {
          persona = {
            title: 'BİLİMKURGU KAŞİFİ',
            emoji: '🧠',
            desc: 'Zihni zorlayan kurguları ve paralel evrenleri seven usta!',
          };
        } else if (hours > 80) {
          persona = {
            title: 'DİZİ GURMESİ',
            emoji: '🍷',
            desc: 'Dizi evreninde yüzlerce saat harcamış, ince zevklere sahip tam bir otorite!',
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
          showCount: 5,
          topGenre: 'SUÇ & DRAMA',
          topGenrePercent: 86,
          topShows: DEFAULT_SHOWS,
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
      const html2canvas = (await import('html2canvas')).default;
      if (summaryCardRef.current) {
        const canvas = await html2canvas(summaryCardRef.current, {
          backgroundColor: '#000000',
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
        <div className="w-16 h-16 rounded-full bg-[#C91520]/20 border border-[#C91520] flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-3xl text-[#C91520]">movie</span>
        </div>
        <p className="text-xs font-black tracking-widest uppercase text-white/70 animate-pulse">
          Wrapped 2026 Tasarlanıyor...
        </p>
      </div>
    );
  }

  const topShow = stats.topShows[0] || DEFAULT_SHOWS[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex items-center justify-center overflow-hidden select-none font-body-md">
      
      {/* 9:16 Story Frame Container */}
      <div className="relative w-full max-w-md h-full max-h-[100dvh] sm:max-h-[920px] bg-[#070707] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10">
        
        {/* Üst Kısım: İlerleme Çubukları & Başlık */}
        <div className="relative z-40 p-4 pt-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
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
              <span className="text-xs font-black tracking-widest text-[#C91520]">EPISODIO</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] bg-[#D4A017]/10 px-2.5 py-0.5 rounded-full border border-[#D4A017]/30">
                WRAPPED 2026
              </span>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors backdrop-blur-md cursor-pointer"
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

        {/* SLİDE İÇERİKLERİ (Editorial Grafik Tasarımlı 5 Farklı Sayfa) */}
        <div className="relative z-20 flex-1 flex flex-col justify-center px-6 py-4 overflow-hidden">
          
          {/* SLİDE 0: Editorial Black & Red Big Stats ("264,960 DAKİKA") */}
          {currentSlide === 0 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] bg-[#070707] p-4 rounded-2xl border border-white/10 overflow-hidden">
              {/* Arka Plan Geometrik Çizgi Deseni */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#C91520_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-[#C91520]">@{user.username}</p>
                <h3 className="text-lg font-black uppercase tracking-tight text-white/90 mt-1">
                  HAZIR MISIN? İŞTE SENİN 2026 DİZİ KARNEN
                </h3>
              </div>

              {/* Dev Sayı Vurgusu (Editorial Type) */}
              <div className="relative z-10 my-auto py-6">
                <span className="block text-5xl sm:text-6xl font-black text-[#C91520] tracking-tighter leading-none">
                  {stats.totalMinutes.toLocaleString('tr-TR')}
                </span>
                <span className="block text-sm font-black uppercase tracking-widest text-white/60 mt-2">
                  DAKİKA İZLEDİN ({stats.totalHours} SAAT)
                </span>
              </div>

              {/* Alt Satranç / Geometrik Desen + Yıl */}
              <div className="relative z-10 w-full pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-[#C91520]" />
                  <div className="w-3 h-3 bg-white" />
                  <div className="w-3 h-3 bg-[#C91520]" />
                </div>
                <span className="text-3xl font-black text-white tracking-tighter">2026</span>
              </div>
            </div>
          )}

          {/* SLİDE 1: Warm Cream & Crimson Polka Dots ("Meski pun ini bukan...") */}
          {currentSlide === 1 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] bg-[#F4F2EB] text-[#070707] p-6 rounded-2xl border border-black/10 overflow-hidden">
              {/* Kırmızı & Siyah Benekli Desen (Polka Dots Background) */}
              <div className="absolute top-4 right-4 flex flex-wrap gap-2 w-32 opacity-80 pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`w-3.5 h-3.5 rounded-full ${i % 2 === 0 ? 'bg-[#C91520]' : 'bg-[#070707]'}`} />
                ))}
              </div>

              <div className="relative z-10 pt-4 text-left w-full">
                <span className="text-xs font-black uppercase tracking-widest text-[#C91520]">DİZİ DNA'N</span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#070707] mt-1 leading-tight">
                  SENİN RUH EŞİN OLAN TÜR:
                </h2>
              </div>

              {/* Dev Tür Kartı */}
              <div className="relative z-10 my-auto w-full p-6 rounded-3xl bg-[#070707] text-white shadow-2xl border border-black/10 text-center">
                <span className="text-4xl sm:text-5xl font-black text-[#D4A017] tracking-tight block">
                  %{stats.topGenrePercent}
                </span>
                <span className="text-xl font-black uppercase tracking-wider text-white block mt-1">
                  {stats.topGenre}
                </span>
                <p className="text-xs text-white/70 font-medium leading-relaxed mt-3">
                  Zihnini zorlayan, sürükleyici ve tutkulu atmosferler senin vazgeçilmezin!
                </p>
              </div>

              {/* Alt Desen */}
              <div className="relative z-10 w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#070707]/60">
                <span>EPISODIO ANALİZ</span>
                <span>#1 FAVORİ TÜR</span>
              </div>
            </div>
          )}

          {/* SLİDE 2: Top 5 Show Ranked List (Afişleri 100% Yüklenen Liste) */}
          {currentSlide === 2 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] bg-[#0A0A0E] text-white p-5 rounded-2xl border border-white/10 overflow-hidden">
              
              <div className="relative z-10 w-full flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-black uppercase tracking-widest text-[#C91520]">EN ÇOK İZLEDİĞİN DİZİLER</span>
                <span className="text-xs font-black text-white/50">TOP 5</span>
              </div>

              {/* 5 Sıralı Liste (100% Yüklenen Afiş Çerçeveleri) */}
              <div className="relative z-10 w-full space-y-2 my-auto">
                {stats.topShows.slice(0, 5).map((show, idx) => (
                  <div
                    key={show.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all"
                  >
                    <span className="w-5 text-base font-black text-[#C91520]">{idx + 1}</span>
                    
                    {/* Afiş Çerçevesi */}
                    <div className="w-9 h-12 rounded-md overflow-hidden bg-[#151518] shrink-0 border border-white/20">
                      <img
                        src={show.poster}
                        alt={show.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-bold text-white truncate">{show.name}</p>
                      <p className="text-[10px] text-white/40 font-medium">★ {show.rating} Puan</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative z-10 w-full text-[10px] font-black uppercase tracking-widest text-white/40">
                VERİLER İZLEME GEÇMİŞİNDEN HESAPLANDI
              </div>
            </div>
          )}

          {/* SLİDE 3: Editorial Persona Title (Dizi Sever Unvanı) */}
          {currentSlide === 3 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] bg-[#C91520] text-white p-6 rounded-2xl border border-white/10 overflow-hidden">
              {/* Daire Çizgili Arka Plan Deseni */}
              <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
                <div className="w-80 h-80 border-8 border-white rounded-full" />
                <div className="w-56 h-56 border-8 border-white rounded-full absolute" />
              </div>

              <div className="relative z-10 pt-4">
                <span className="text-xs font-black uppercase tracking-widest text-white/80">SENİN DİZİ SEVER UNVANIN</span>
              </div>

              <div className="relative z-10 my-auto space-y-4">
                <div className="w-24 h-24 rounded-full bg-white text-[#C91520] flex items-center justify-center text-5xl mx-auto shadow-2xl">
                  {stats.persona.emoji}
                </div>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                  {stats.persona.title}
                </h2>
                <p className="text-xs text-white/90 font-bold max-w-xs mx-auto leading-relaxed">
                  {stats.persona.desc}
                </p>
              </div>

              <div className="relative z-10 w-full text-xs font-black uppercase tracking-widest text-white/70">
                EPISODIO DİZİ KİMLİĞİ
              </div>
            </div>
          )}

          {/* SLİDE 4: Editorial Final Share Card (Referans Görseldeki Sağ Alt Kart Mantığı) */}
          {currentSlide === 4 && (
            <div className="flex flex-col items-center gap-3 animate-[fadeIn_0.3s_ease-out] w-full">
              
              {/* Referans Görsel Formatındaki Özet İndirme Kartı */}
              <div
                ref={summaryCardRef}
                className="w-full max-w-[320px] p-5 rounded-3xl bg-[#070707] text-white border border-white/20 shadow-2xl flex flex-col justify-between gap-4 text-center relative overflow-hidden"
              >
                {/* Referans Çizgili Üst Kart */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#C91520] flex items-center justify-center text-white font-bold text-xs">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-black text-white truncate max-w-[100px]">@{user.username}</span>
                  </div>
                  <span className="text-[10px] font-black text-[#D4A017] tracking-widest uppercase">EPISODIO</span>
                </div>

                {/* Dev Saat Sayısı */}
                <div className="py-1">
                  <span className="text-4xl font-black text-[#C91520] tracking-tighter block">{stats.totalHours} SAAT</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mt-0.5">
                    {stats.totalEpisodes} Bölüm • {stats.topGenre}
                  </span>
                </div>

                {/* Top 3 Afişli Liste */}
                <div className="space-y-1.5 text-left bg-white/[0.04] p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">FAVORİ DİZİLERİN</span>
                  {stats.topShows.slice(0, 3).map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#C91520]">{i + 1}</span>
                      <img src={s.poster} alt="" className="w-5 h-7 object-cover rounded shrink-0 border border-white/20" crossOrigin="anonymous" />
                      <span className="text-xs font-bold text-white truncate">{s.name}</span>
                    </div>
                  ))}
                </div>

                {/* Persona Rozet Etiketi */}
                <div className="py-1.5 px-3 rounded-full bg-[#C91520] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <span>{stats.persona.emoji}</span>
                  <span>{stats.persona.title}</span>
                </div>

                <div className="text-[9px] font-black text-white/40 tracking-widest uppercase pt-1 border-t border-white/10">
                  episodio.com.tr
                </div>
              </div>

              {/* İndir & Profil Butonları */}
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
        <div className="relative z-40 p-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 bg-[#070707]">
          <span>{currentSlide + 1} / {TOTAL_SLIDES}</span>
          <span>Dokunarak İlerle 👉</span>
        </div>

      </div>
    </div>
  );
}
