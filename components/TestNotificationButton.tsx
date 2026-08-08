'use client';

import { useState } from 'react';
import { requestNotificationPermission, sendLocalNotification } from '@/lib/pushNotifications';

export default function TestNotificationButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        await sendLocalNotification(
          'Episodio Bildirim Testi 🔔',
          'Tebrikler! Kilit ekranı bildirimleri cihazınızda kusursuz çalışıyor.',
          '/notifications'
        );
        setStatus('success');
      } else if (permission === 'denied') {
        setStatus('denied');
      } else {
        setStatus('unsupported');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleTest}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-[#C91520] hover:bg-[#A8121B] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-lg active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            <span>Mobil Bildirimi Test Et</span>
          </>
        )}
      </button>

      {status === 'success' && (
        <p className="text-xs text-green-400 font-medium">
          ✅ Bildirim gönderildi! Kilit ekranına ve üst panele bakın.
        </p>
      )}
      {status === 'denied' && (
        <p className="text-xs text-yellow-400 font-medium">
          ⚠️ Tarayıcı bildirim izni engellenmiş. Tarayıcı site ayarlarından izin verin.
        </p>
      )}
    </div>
  );
}
