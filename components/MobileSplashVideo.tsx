'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSplashVideo() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Hide on desktop (>= 1024px)
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsVisible(false);
      return;
    }

    const video = videoRef.current;
    if (video) {
      // Enable sound
      video.muted = false;
      video.volume = 1.0;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser restricts unmuted autoplay, start muted initially
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    }

    // Safety timer: auto dismiss after 4.5s max
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
      const video = videoRef.current;
      // Always unmute on user interaction
      video.muted = false;
      video.volume = 1.0;

      if (video.paused) {
        video.play().catch(() => handleFinish());
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
      className={`fixed inset-0 z-[999999] cursor-pointer flex items-center justify-center bg-black transition-opacity duration-500 md:hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src="/splash_video.mp4"
        poster="/splash_bg.jpg"
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onLoadedData={() => setIsVideoReady(true)}
        onEnded={handleFinish}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isVideoReady ? 'opacity-100' : 'opacity-90'
        }`}
      />
    </div>
  );
}






