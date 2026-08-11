'use client';

import { useState, useEffect, useRef } from 'react';

interface ThemeMusicPlayerProps {
  showName: string;
  originalName?: string;
}

export default function ThemeMusicPlayer({ showName, originalName }: ThemeMusicPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sunucu API Proxy üzerinden Jenerik Müziğini Sorgula
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
      fetchThemeMusic();
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
        title={isPlaying ? 'Müziği Durdur' : 'Jeneriği Dinle'}
        className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white select-none active:scale-95 ${
          isPlaying ? 'border-[#C91520] bg-[#C91520]/20 text-white shadow-[0_0_20px_rgba(201,21,32,0.4)]' : ''
        }`}
      >
        {/* Soldaki Kırmızı Nota İkonu */}
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-[#C91520] rounded-full animate-spin shrink-0" />
        ) : (
          <span
            className="material-symbols-outlined text-[17px] text-[#C91520] shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            music_note
          </span>
        )}

        {/* Yalnızca "Jeneriği Dinle" Metni */}
        <span>
          {loading
            ? 'Yükleniyor...'
            : error
            ? 'Müzik Bulunamadı'
            : isPlaying
            ? 'Jeneriği Durdur'
            : 'Jeneriği Dinle'}
        </span>
      </button>
    </div>
  );
}
