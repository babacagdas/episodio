'use client';

import { useState, useEffect, useRef } from 'react';

interface ThemeMusicPlayerProps {
  showName: string;
  originalName?: string;
}

export default function ThemeMusicPlayer({ showName, originalName }: ThemeMusicPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>('');
  const [artistName, setArtistName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sunucu API Proxy üzerinden Jenerik Müziğini Sorgula (PWA & WebKit CORS Uyumlu)
  async function fetchThemeMusic() {
    if (hasFetched) return;
    setLoading(true);
    setError(false);

    try {
      const url = `/api/theme-music?show=${encodeURIComponent(showName)}&original=${encodeURIComponent(originalName || '')}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.previewUrl) {
        setAudioUrl(data.previewUrl);
        setTrackName(data.trackName || 'Jenerik Müziği');
        setArtistName(data.artistName || '');
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
