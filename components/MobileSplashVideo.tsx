'use client';

import { useState, useEffect, useRef } from 'react';

export default function MobileSplashVideo() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Hide on desktop (>= 1024px)
      if (window.innerWidth >= 1024) {
        setIsVisible(false);
        return;
      }
      // Check if splash video was already shown in this session
      if (sessionStorage.getItem('episodio_splash_shown') === 'true') {
        setIsVisible(false);
        return;
      }
      // Mark as shown for this session
      sessionStorage.setItem('episodio_splash_shown', 'true');
    }

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Low Power Mode or iOS policy blocked autoplay -> finish immediately so app opens
          handleFinish();
        });
      }
    }

    // Low Power Mode safety check: If video remains paused after 800ms, dismiss overlay
    const checkTimer = setTimeout(() => {
      if (videoRef.current && videoRef.current.paused) {
        handleFinish();
      }
    }, 800);

    return () => clearTimeout(checkTimer);
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translateZ(0)',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
      className="md:hidden"
    >
      {/* Pitch-black shield blocking WebKit GPU Metal clear color */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000000',
          zIndex: 10,
          opacity: isPlaying ? 0 : 1,
          transition: 'opacity 0.2s ease-out',
          pointerEvents: 'none',
        }}
      />

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
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000000',
          transform: 'translateZ(0)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}








