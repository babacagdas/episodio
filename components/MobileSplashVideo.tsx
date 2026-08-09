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

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If iOS blocks autoplay initially, tapping screen will trigger play
        });
      }
    }

    // Safety timer: auto dismiss after 4.5s max so app never hangs
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 4500);

    return () => clearTimeout(safetyTimer);
  }, []);

  function handleFinish() {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 450);
  }

  function handleUserClick() {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => handleFinish());
      } else {
        handleFinish();
      }
    } else {
      handleFinish();
    }
  }

  if (!isVisible) return null;

  return (
    <div
      onClick={handleUserClick}
      className={`fixed inset-0 z-[999999] cursor-pointer flex items-center justify-center bg-[#0A0A0A] transition-opacity duration-500 md:hidden ${
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
        className="h-full w-full object-cover"
      />
    </div>
  );
}





