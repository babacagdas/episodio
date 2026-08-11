'use client';

import { useState, useEffect, useRef } from 'react';

interface ThemeMusicPlayerProps {
  showName: string;
}

export default function ThemeMusicPlayer({ showName }: ThemeMusicPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>('');
  const [artistName, setArtistName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // iTunes Public API'den Jenerik Müziğini Sorgula (0 DB Yükü & Yüksek Doğruluk Filtresi)
  async function fetchThemeMusic() {
    if (hasFetched) return;
    setLoading(true);
    setError(false);

    const cleanShowName = showName.toLowerCase().trim();

    try {
      const queries = [
        `${showName} TV Series Main Title Theme`,
        `${showName} Soundtrack Theme`,
        `${showName} Jenerik`,
        `${showName} Theme`,
      ];

      let foundTrack: any = null;

      for (const q of queries) {
        if (foundTrack) break;
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=6`);
        const data = await res.json();
        if (!data.results || data.results.length === 0) continue;

        // 1. Aşama: Hem dizi adını hem de 'theme' / 'soundtrack' / 'jenerik' ifadesini içeren kesin eşleşme
        const exactMatch = data.results.find((t: any) => {
          if (!t.previewUrl) return false;
          const trackLower = (t.trackName || '').toLowerCase();
          const collectionLower = (t.collectionName || '').toLowerCase();

          const matchesShowName = trackLower.includes(cleanShowName) || collectionLower.includes(cleanShowName);
          const isTheme = trackLower.includes('theme') || trackLower.includes('main title') || trackLower.includes('ost') || trackLower.includes('soundtrack') || trackLower.includes('jenerik') || collectionLower.includes('soundtrack') || collectionLower.includes('ost');

          return matchesShowName && isTheme;
        });

        // 2. Aşama: En azından dizi adı eşleşen müzik
        const nameMatch = data.results.find((t: any) => {
          if (!t.previewUrl) return false;
          const trackLower = (t.trackName || '').toLowerCase();
          const collectionLower = (t.collectionName || '').toLowerCase();
          return trackLower.includes(cleanShowName) || collectionLower.includes(cleanShowName);
        });

        foundTrack = exactMatch || nameMatch;
      }

      if (foundTrack && foundTrack.previewUrl) {
        setAudioUrl(foundTrack.previewUrl);
        setTrackName(foundTrack.trackName);
        setArtistName(foundTrack.artistName);
        setHasFetched(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!hasFetched) {
      fetchThemeMusic().then(() => {
        // Otomatik başlatma state güncellemesi sonrasında tetiklenir
      });
      return;
    }

    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }

  useEffect(() => {
    if (audioUrl && hasFetched && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [audioUrl, hasFetched]);

  return (
    <div className="relative inline-flex items-center">
      {/* Gizli Audio HTML Elemanı */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      <button
        type="button"
        onClick={togglePlay}
        disabled={loading}
        title={isPlaying ? 'Jenerik Müziğini Durdur' : 'Jenerik Müziğini Dinle'}
        className={`group relative inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 select-none active:scale-95 ${
          isPlaying
            ? 'border-[#C91520] bg-[#C91520]/20 text-white shadow-[0_0_20px_rgba(201,21,32,0.4)]'
            : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white'
        }`}
      >
        {/* İkon / Equalizer Ses Dalgası Animasyonu */}
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
        ) : isPlaying ? (
          <div className="flex items-center gap-0.5 h-3.5 shrink-0">
            <span className="w-0.5 bg-[#C91520] rounded-full animate-[equalize_0.6s_infinite_ease-in-out]" style={{ animationDelay: '0s' }} />
            <span className="w-0.5 bg-[#C91520] rounded-full animate-[equalize_0.6s_infinite_ease-in-out]" style={{ animationDelay: '0.2s' }} />
            <span className="w-0.5 bg-[#C91520] rounded-full animate-[equalize_0.6s_infinite_ease-in-out]" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : (
          <span className="material-symbols-outlined text-[17px] text-[#C91520] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            music_note
          </span>
        )}

        {/* Metin Etiketi */}
        <span className="truncate max-w-[150px] sm:max-w-[200px]">
          {loading
            ? 'Müzik Yükleniyor...'
            : isPlaying
            ? `Çalıyor: ${trackName || 'Jenerik Müziği'}`
            : error
            ? 'Müzik Bulunamadı'
            : 'Jenerik Müziği Dinle 🎵'}
        </span>

        {/* Dynamic Equalizer Keyframes Inline Style */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes equalize {
              0%, 100% { height: 4px; }
              50% { height: 14px; }
            }
          `
        }} />
      </button>
    </div>
  );
}
