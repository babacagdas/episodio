'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSplashVideo() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if device is mobile viewport
    const isMobile = window.innerWidth < 768;
    const hasSeenVideo = sessionStorage.getItem('episodio_splash_video_played');

    if (isMobile && !hasSeenVideo) {
      setIsVisible(true);
    }
  }, []);

  function handleFinish() {
    sessionStorage.setItem('episodio_splash_video_played', 'true');
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 500);
  }

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 md:hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src="/splash_video.mp4"
        autoPlay
        muted={isMuted}
        playsInline
        preload="auto"
        onEnded={handleFinish}
        onError={handleFinish}
        className="h-full w-full object-cover"
      />

      {/* Top Right Skip Button */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute top-6 right-5 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-all active:scale-95 shadow-lg"
      >
        <span>Atla</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>

      {/* Bottom Right Mute Toggle */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-8 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all active:scale-95 shadow-lg"
        aria-label="Ses Değiştir"
      >
        <span className="material-symbols-outlined text-lg">
          {isMuted ? 'volume_off' : 'volume_up'}
        </span>
      </button>
    </div>
  );
}
