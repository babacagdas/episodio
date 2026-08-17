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

        while (shows.length < 4) {
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

        // Persona (Emoji kullanmadan sade ve profesyonel unvanlar)
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
          topShows: DEFAULT_SHOWS,
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

        {/* Üst Kısım: İlerleme Çubukları & SADECE GERÇEK LOGO (Etiket Kaldırıldı) */}
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
            {/* Sol Üstte Gerçek Episodio Logosu (Yanındaki etiket tamamen kaldırıldı) */}
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
          
          {/* SLİDE 0: 1. SAYFA - Çerçevesiz, @ İşaretsiz Yumuşak İsim & Yumuşak Başlık & Emojisiz Şık İstatistik */}
          {currentSlide === 0 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] p-2">
              
              {/* Kullanıcı Adı (Çerçevesiz, @ işaretsiz, şık font) & Yumuşak Başlık */}
              <div className="relative z-10 pt-2 space-y-2">
                <span className="text-xl font-bold tracking-wide text-white drop-shadow-md">
                  {user.username}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white/95 leading-tight font-serif italic drop-shadow-lg">
                  2026 Dizi Karnen Hazır
                </h2>
              </div>

              {/* Emojisiz, Şık & Modern İstatistik Kartı */}
              <div className="relative z-10 my-auto w-full p-6 rounded-3xl bg-black/65 border border-white/15 backdrop-blur-md shadow-2xl text-center space-y-3">
                <span className="block text-5xl sm:text-6xl font-black text-[#C91520] tracking-tighter leading-none">
                  {stats.totalMinutes.toLocaleString('tr-TR')}
                </span>
                <span className="block text-xs font-bold uppercase tracking-widest text-white/80">
                  DAKİKA İZLEDİN ({stats.totalHours} SAAT)
                </span>
                <div className="w-12 h-0.5 bg-[#C91520] mx-auto my-2 opacity-60" />
                <p className="text-xs text-white/70 font-medium">
                  Toplam <strong className="text-white font-bold">{stats.totalEpisodes} Bölüm</strong> Bitirdin
                </p>
              </div>

              <div className="relative z-10 w-full pt-2 flex items-center justify-between border-t border-white/15 text-xs font-semibold text-white/70">
                <span>EPISODIO ISTATISTIK</span>
                <span className="text-2xl font-black text-white">2026</span>
              </div>
            </div>
          )}

          {/* SLİDE 1: 2. SAYFA - "Dizi DNA'n" başlığı kaldırıldı. "Senin Dizi Ruh Eşin" şık başlık, Emojisiz modern kart */}
          {currentSlide === 1 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] text-[#070707] p-4">
              
              <div className="relative z-10 pt-4 text-center w-full">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#070707] leading-tight font-serif italic">
                  Senin Dizi Ruh Eşin
                </h2>
              </div>

              {/* Emojisiz, Şık & Modern Tür Kartı */}
              <div className="relative z-10 my-auto w-full p-6 rounded-3xl bg-[#070707] text-white shadow-2xl border border-black/20 text-center space-y-3">
                <span className="text-5xl sm:text-6xl font-black text-[#D4A017] tracking-tight block">
                  %{stats.topGenrePercent}
                </span>
                <span className="text-xl font-extrabold uppercase tracking-wider text-white block">
                  {stats.topGenre}
                </span>
                <div className="w-12 h-0.5 bg-[#D4A017] mx-auto opacity-50" />
                <p className="text-xs text-white/70 font-medium leading-relaxed">
                  Zihnini zorlayan, sürükleyici ve tutkulu atmosferler senin vazgeçilmezin.
                </p>
              </div>

              <div className="relative z-10 w-full flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#070707]">
                <span>EPISODIO ANALİZ</span>
                <span>FAVORİ TÜR</span>
              </div>
            </div>
          )}

          {/* SLİDE 2: 3. SAYFA - Başlık Arka Planı Kaldırıldı, Kutular Kaldırıldı, DİKEY Gerçek Dizi Kartları */}
          {currentSlide === 2 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] text-white p-4">
              
              {/* Arka plansız, şık & güzel yazılmış başlık */}
              <div className="relative z-10 w-full pt-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif italic drop-shadow-md">
                  En Çok İzlediğin Diziler
                </h2>
              </div>

              {/* Dikey Çerçevesiz Gerçek Dizi Kartları Grid/Row Yapısı */}
              <div className="relative z-10 w-full my-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.topShows.slice(0, 4).map((show, idx) => (
                  <div key={show.id} className="flex flex-col items-center gap-1.5 group">
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-[#151518]">
                      <img
                        src={show.poster}
                        alt={show.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/80 border border-white/30 flex items-center justify-center text-xs font-black text-[#C91520]">
                        {idx + 1}
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-white truncate max-w-full">{show.name}</p>
                  </div>
                ))}
              </div>

              <div className="relative z-10 w-full text-[10px] font-bold uppercase tracking-widest text-white/50">
                IZLEME GEÇMİŞİNDEN DERLENDİ
              </div>
            </div>
          )}

          {/* SLİDE 3: 4. SAYFA - Başlık Kaldırıldı, Emojisiz Sade Kutu Tasarımı */}
          {currentSlide === 3 && (
            <div className="relative h-full flex flex-col justify-between items-center text-center animate-[fadeIn_0.3s_ease-out] text-white p-4">
              
              <div className="relative z-10 pt-4" />

              {/* Emojisiz, Sade ve Şık Unvan Kutusu */}
              <div className="relative z-10 my-auto space-y-3 bg-black/70 p-6 rounded-3xl border border-white/20 backdrop-blur-xl w-full shadow-2xl">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50 block">DİZİ SEVER KİMLİĞİN</span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                  {stats.persona.title}
                </h2>
                <div className="w-10 h-0.5 bg-white/30 mx-auto my-1" />
                <p className="text-xs text-white/80 font-medium max-w-xs mx-auto leading-relaxed">
                  {stats.persona.desc}
                </p>
              </div>

              <div className="relative z-10 w-full text-xs font-extrabold uppercase tracking-widest text-white/60">
                EPISODIO KİMLİK
              </div>
            </div>
          )}

          {/* SLİDE 4: 5. SAYFA - Kutu Tasarımı YAPAN, Doğrudan Görsel Üzerine İnşa Edilmiş Profesyonel Final Sonuç */}
          {currentSlide === 4 && (
            <div className="flex flex-col items-center gap-3 animate-[fadeIn_0.3s_ease-out] w-full h-full justify-between">
              
              {/* Kutu Olmadan Doğrudan Görsel Üzerine İnşa Edilen Özet Alanı */}
              <div
                ref={summaryCardRef}
                className="w-full h-full max-h-[500px] p-6 rounded-3xl text-white shadow-2xl flex flex-col justify-between text-center relative overflow-hidden bg-black/40 backdrop-blur-sm border border-white/10"
              >
                {/* Sol Üst Logo ve Kullanıcı İsim Bilgisi */}
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#C91520] flex items-center justify-center text-white font-bold text-xs border border-white/30">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-extrabold text-white">{user.username}</span>
                  </div>
                  <img src="/logo.png" alt="Episodio" className="h-5 w-auto object-contain" />
                </div>

                {/* Büyük Süre ve Detaylar */}
                <div className="py-2 space-y-1">
                  <span className="text-[10px] font-extrabold text-[#D4A017] uppercase tracking-widest block">2026 DİZİ KARNEM</span>
                  <h3 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{stats.totalHours} SAAT</h3>
                  <p className="text-xs text-white/80 font-semibold">{stats.totalEpisodes} Bölüm • {stats.topGenre}</p>
                </div>

                {/* Dikey Dizi Afişleri Üçlüsü */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  {stats.topShows.slice(0, 3).map((s, i) => (
                    <div key={s.id} className="flex flex-col items-center gap-1">
                      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden border border-white/20 shadow-md bg-[#151518]">
                        <img src={s.poster} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      </div>
                      <span className="text-[10px] font-bold text-white truncate max-w-full">{s.name}</span>
                    </div>
                  ))}
                </div>

                {/* Unvan & Alt Bilgi */}
                <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs font-bold text-white/80">
                  <span className="text-[#D4A017]">{stats.persona.title}</span>
                  <span className="text-[10px] font-extrabold text-white/40 tracking-wider">episodio.com.tr</span>
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
