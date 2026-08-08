'use client';

import { useState, useEffect } from 'react';
import { requestNotificationPermission, registerServiceWorker } from '@/lib/pushNotifications';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    registerServiceWorker();

    if (Notification.permission === 'default') {
      const dismissed = localStorage.getItem('episodio_push_prompt_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (!showPrompt) return null;

  const handleEnable = async () => {
    setLoading(true);
    const permission = await requestNotificationPermission();
    setLoading(false);
    setShowPrompt(false);
    if (permission === 'denied') {
      localStorage.setItem('episodio_push_prompt_dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('episodio_push_prompt_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#141414]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C91520]/15 border border-[#C91520]/30 flex items-center justify-center text-[#C91520] shrink-0">
              <span className="material-symbols-outlined text-2xl animate-pulse">notifications_active</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Mobil Bildirimleri Aç</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Yeni mesajlar ve takipçilerden kilit ekranında anında haberdar ol.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white transition-colors p-1"
            title="Kapat"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            Sonra
          </button>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="bg-[#C91520] hover:bg-[#A8121B] text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-colors shadow-lg flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">notifications</span>
                <span>Bildirimleri Aç</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
