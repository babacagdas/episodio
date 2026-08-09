'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSplashVideo() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if mobile viewport or standalone PWA
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.matchMedia('(max-width: 767px)').matches);

    if (isMobile) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      const video = videoRef.current;
      video.muted = true; // Required for iOS Safari Autoplay

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Attempt to unmute after playback begins
            try {
              video.muted = false;
            } catch {
              // Ignore if browser restricts unmuting
            }
          })
          .catch(() => {
            // Fallback for iOS
            video.muted = true;
            video.play().catch(() => handleFinish());
          });
      }
    }
  }, [isVisible]);

  function handleFinish() {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 450);
  }

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black transition-opacity duration-500 md:hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src="/splash_video.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleFinish}
        onError={handleFinish}
        className="h-full w-full object-cover"
      />
    </div>
  );
}


