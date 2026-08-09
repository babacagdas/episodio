'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSplashVideo() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Check if mobile viewport or standalone PWA
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      const video = videoRef.current;
      video.muted = false;
      
      // Attempt unmuted autoplay
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy blocks unmuted autoplay, fallback to muted autoplay
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
    }, 500);
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
        playsInline
        preload="auto"
        onEnded={handleFinish}
        onError={handleFinish}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

