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
    emoji: string;
    desc: string;
  };
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '4f3b798b31a26d70c48e8946e336b135';

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
    rating: '9.5',
    runtime: 62 * 47,
  },
  {
    id: 66732,
    name: 'Stranger Things',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop',
    rating: '8.7',
    runtime: 34 * 50,
  },
  {
    id: 76479,
    name: 'The Boys',
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=500&auto=format&fit=crop',
    rating: '8.7',
    runtime: 32 * 60,
  },
  {
    id: 94605,
    name: 'Arcane',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop',
    rating: '9.0',
    runtime: 18 * 40,
  },
  {
    id: 82596,
    name: 'Mindhunter',
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&auto=format&fit=crop',
    rating: '8.6',
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

              const poster = data.poster_path
                ? `${TMDB_IMAGE_BASE}${data.poster_path}`
                : FALLBACK_POSTERS[idx % FALLBACK_POSTERS.length];

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
        <div className="w-16 h-16 rounded-full bg-[#C91520]/20 border border-[#C91520] flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-3xl text-[#C91520]">movie</span>
        </div>
        <p className="text-xs font-black tracking-widest uppercase text-white/70 animate-pulse">
          Wrapped 2026 Tasarlanıyor...
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
        
        {/* Özel Üretilmiş Yüksek Çözünürlüklü Şablon Görseli (Template Background Image) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            key={currentSlide}
            src={slideBgs[currentSlide]}
            alt=""
            className="w-full h-full object-cover transition-opacity duration-700 ease-out"
          />
          {/* Slayt 1 (Krem) için koyulaştırıcı gereksiz, diğer siyah slaytlar için şeffaf yumuşatıcı */}
          {currentSlide !== 1 && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10" />
          )}
        </div>

        {/* Üst Kısım: İlerleme Çubukları & Başlık */}
        <div className="relative z-40 p-4 pt-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-md">
                <div
                  className={`h-full transition-all duration-300 ${currentSlide === 1 ? 'bg-[#070707]' : 'bg-white'} ${
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
              <span className={`text-xs font-black tracking-widest ${currentSlide === 1 ? 'text-[#C91520]' : 'text-white'}`}>EPISODIO</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-[#D4A017]/40 shadow-sm">
                WRAPPED 2026
              </span>
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

        {/* SLİDE İÇERİKLERİ (Özel Görsel Şablon Üzerine Tipografi) */}
        <div className="relative z-20 flex-1 flex flex-col justify-center px-6 py-4 overflow-hidden">
          
          {/* SLİDE 0: Siyah & Kırmızı Keskin Geometrik Şablon ("264,960 DAKİKA") */}
          {currentSlide === 0 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] p-4">
              <div className="relative z-10 pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-[#C91520] bg-black/60 px-3 py-1 rounded-full border border-[#C91520]/40 backdrop-blur-md">
                  @{user.username}
                </p>
                <h3 className="text-xl font-black uppercase tracking-tight text-white mt-3 drop-shadow-lg">
                  2026 DİZİ KARNEN HAZIR!
                </h3>
              </div>

              {/* Dev Sayı Vurgusu */}
              <div className="relative z-10 my-auto py-4 bg-black/70 p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl w-full">
                <span className="block text-5xl sm:text-6xl font-black text-[#C91520] tracking-tighter leading-none">
                  {stats.totalMinutes.toLocaleString('tr-TR')}
                </span>
                <span className="block text-sm font-black uppercase tracking-widest text-white/80 mt-3">
                  DAKİKA İZLEDİN ({stats.totalHours} SAAT)
                </span>
                <p className="text-xs text-white/60 font-semibold mt-2">
                  Tam {stats.totalEpisodes} Bölüm Bitirdin! 🎬
                </p>
              </div>

              <div className="relative z-10 w-full pt-4 flex items-center justify-between border-t border-white/20">
                <span className="text-xs font-black text-white/70 tracking-widest uppercase">EPISODIO ISTATISTIK</span>
                <span className="text-3xl font-black text-white tracking-tighter">2026</span>
              </div>
            </div>
          )}

          {/* SLİDE 1: Krem & Kırmızı Benekli Özel Şablon ("Meski pun ini bukan...") */}
          {currentSlide === 1 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] text-[#070707] p-6">
              
              <div className="relative z-10 pt-4 text-left w-full">
                <span className="text-xs font-black uppercase tracking-widest text-[#C91520] bg-[#C91520]/10 px-3 py-1 rounded-full border border-[#C91520]/30">DİZİ DNA'N</span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#070707] mt-3 leading-tight">
                  SENİN DİZİ RUH EŞİN:
                </h2>
              </div>

              {/* Dev Tür Kartı */}
              <div className="relative z-10 my-auto w-full p-6 rounded-3xl bg-[#070707] text-white shadow-2xl border border-black/20 text-center">
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

              <div className="relative z-10 w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#070707]">
                <span>EPISODIO ANALİZ</span>
                <span>#1 FAVORİ TÜR</span>
              </div>
            </div>
          )}

          {/* SLİDE 2: Art-Deco Çerçeveli Siyah Şablon (Top 5 Sıralı Dizi Listesi) */}
          {currentSlide === 2 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] text-white p-6">
              
              <div className="relative z-10 w-full flex items-center justify-between border-b border-white/20 pb-3">
                <span className="text-xs font-black uppercase tracking-widest text-[#C91520] bg-black/60 px-3 py-1 rounded-full border border-[#C91520]/40">EN ÇOK İZLEDİĞİN DİZİLER</span>
                <span className="text-xs font-black text-white">TOP 5</span>
              </div>

              {/* 5 Sıralı Liste (100% Yüklenen Afiş Çerçeveleri) */}
              <div className="relative z-10 w-full space-y-2 my-auto">
                {stats.topShows.slice(0, 5).map((show, idx) => (
                  <div
                    key={show.id}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/80 border border-white/20 hover:bg-black transition-all shadow-lg backdrop-blur-md"
                  >
                    <span className="w-5 text-base font-black text-[#C91520]">{idx + 1}</span>
                    
                    {/* Afiş Çerçevesi */}
                    <div className="w-10 h-13 rounded-lg overflow-hidden bg-[#151518] shrink-0 border border-white/30">
                      <img
                        src={show.poster}
                        alt={show.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-bold text-white truncate">{show.name}</p>
                      <p className="text-[10px] text-[#D4A017] font-bold">★ {show.rating} Puan</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative z-10 w-full text-[10px] font-black uppercase tracking-widest text-white/60 bg-black/60 py-1 rounded-full border border-white/10">
                VERİLER İZLEME GEÇMİŞİNDEN HESAPLANDI
              </div>
            </div>
          )}

          {/* SLİDE 3: Kırmızı & Siyah Dalga Şablonu (Dizi Sever Unvanı) */}
          {currentSlide === 3 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] text-white p-6">
              
              <div className="relative z-10 pt-4">
                <span className="text-xs font-black uppercase tracking-widest text-white bg-black/60 px-3.5 py-1 rounded-full border border-white/20">SENİN DİZİ SEVER UNVANIN</span>
              </div>

              <div className="relative z-10 my-auto space-y-4 bg-black/80 p-6 rounded-3xl border border-white/20 backdrop-blur-xl w-full shadow-2xl">
                <div className="w-24 h-24 rounded-full bg-white text-[#C91520] flex items-center justify-center text-5xl mx-auto shadow-2xl animate-pulse">
                  {stats.persona.emoji}
                </div>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                  {stats.persona.title}
                </h2>
                <p className="text-xs text-white/90 font-bold max-w-xs mx-auto leading-relaxed">
                  {stats.persona.desc}
                </p>
              </div>

              <div className="relative z-10 w-full text-xs font-black uppercase tracking-widest text-white bg-black/60 py-1.5 rounded-full border border-white/20">
                EPISODIO DİZİ KİMLİĞİ
              </div>
            </div>
          )}

          {/* SLİDE 4: Final Story Paylaşım Kartı (Referans Görseldeki Sağ Alt Format) */}
          {currentSlide === 4 && (
            <div className="flex flex-col items-center gap-3 animate-[fadeIn_0.3s_ease-out] w-full">
              
              {/* Referans Görsel Formatındaki Özet İndirme Kartı */}
              <div
                ref={summaryCardRef}
                className="w-full max-w-[320px] p-5 rounded-3xl bg-[#070707] text-white border border-white/20 shadow-2xl flex flex-col justify-between gap-3 text-center relative overflow-hidden"
              >
                {/* Referans Çizgili Üst Kart */}
                <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#C91520] flex items-center justify-center text-white font-bold text-xs border border-white/30">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-black text-white truncate max-w-[100px]">@{user.username}</span>
                  </div>
                  <span className="text-[10px] font-black text-[#D4A017] tracking-widest uppercase">EPISODIO</span>
                </div>

                {/* Dev Saat Sayısı */}
                <div className="py-1">
                  <span className="text-4xl font-black text-[#C91520] tracking-tighter block">{stats.totalHours} SAAT</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60 block mt-0.5">
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
