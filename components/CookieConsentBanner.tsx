'use client';

import { useState, useEffect } from 'react';

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('episodio_cookie_consent');
      if (!consent) {
        // 1.2 saniye gecikmeyle yumuşakça belirmesi için
        const timer = setTimeout(() => {
          setShow(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('episodio_cookie_consent', 'accepted');
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[99] md:bottom-6 md:left-auto md:right-6 md:max-w-md animate-[chatScaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards] select-none">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0E]/95 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        {/* Kırmızı Işıma (Glow) */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#C91520]/20 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍪</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Çerez Tercihleri
            </h3>
          </div>

          <p className="text-[12px] font-medium leading-relaxed text-white/60">
            Episodio'da oturumunuzu güvenle saklamak, kişiselleştirilmiş dizi önerileri sunmak ve deneyiminizi iyileştirmek için çerezler kullanılmaktadır.
          </p>

          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="w-full rounded-xl bg-[#C91520] px-4 py-2 text-xs font-black text-white shadow-md transition-all duration-200 hover:bg-[#E50914] active:scale-95 sm:w-auto"
            >
              Anladım & Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
