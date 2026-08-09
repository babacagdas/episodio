'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSplashVideo() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Show on mobile and tablet screens
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      const video = videoRef.current;
      video.play().catch(() => {
        // Fallback retry
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }, [isVisible]);

  function handleFinish() {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  }

  if (!isVisible) return null;

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black transition-opacity duration-500 md:hidden ${
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
        className="h-full w-full object-cover"
      />
    </div>
  );
}



