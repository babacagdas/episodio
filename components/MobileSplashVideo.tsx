'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSplashVideo() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Hide on desktop (>= 1024px)
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsVisible(false);
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }, []);

  function handleFinish() {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 450);
  }

  if (!isVisible) return null;

  return (
    <div
      style={{ backgroundColor: '#000000', transform: 'translateZ(0)' }}
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black transition-opacity duration-300 ease-out md:hidden ${
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
        onPlaying={() => setIsPlaying(true)}
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime > 0 && !isPlaying) {
            setIsPlaying(true);
          }
        }}
        onEnded={handleFinish}
        style={{
          backgroundColor: '#000000',
          transform: 'translateZ(0)',
          opacity: isPlaying ? 1 : 0,
          transition: 'opacity 0.2s ease-in',
        }}
        className="h-full w-full object-cover pointer-events-none"
      />
    </div>
  );
}








