'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSplashVideo() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Hide on desktop (>= 1024px)
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsVisible(false);
      return;
    }

    if (videoRef.current) {
      const video = videoRef.current;
      video.muted = true;
      video.play().catch(() => {});
    }
  }, []);

  function handleFinish() {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 500);
  }

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-[#0A0A0A] transition-opacity duration-500 md:hidden ${
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
        controls={false}
        disablePictureInPicture
        onEnded={handleFinish}
        className="h-full w-full object-cover pointer-events-none"
      />
    </div>
  );
}




