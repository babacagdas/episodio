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
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setStatus('unsupported');
        setLoading(false);
        return;
      }

      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        const sent = await sendLocalNotification(
          'Episodio Bildirim Testi 🔔',
          'Tebrikler! Bildirimler cihazınızda kusursuz çalışıyor.',
          '/notifications'
        );
        if (sent) {
          setStatus('success');
        } else {
          setStatus('sent_check_system');
        }
      } else if (permission === 'denied') {
        setStatus('denied');
      } else {
        setStatus('default');
      }
    } catch (e) {
      console.error('Test notification error:', e);
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
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-400">
          ✅ <strong>Bildirim Gönderildi!</strong> Kilit ekranınıza veya ekranın sağ/üst bildirim alanına bakın.
        </div>
      )}

      {status === 'sent_check_system' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
          ℹ️ <strong>İzin Alındı!</strong> Bildirim tetiklendi. Eğer ekranda görmüyorsanız telefon/bilgisayarınızın Rahatsız Etmeyin (Do Not Disturb) modunun kapalı olduğundan emin olun.
        </div>
      )}

      {status === 'denied' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 leading-relaxed">
          ⚠️ <strong>Tarayıcı İzni Engellenmiş!</strong><br />
          Adres çubuğundaki kilit 🔒 simgesine tıklayıp <i>"Bildirimler"</i> iznini <b>Aç / İzin Ver</b> yapın.
        </div>
      )}

      {status === 'unsupported' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300 leading-relaxed">
          📱 <strong>iPhone / iOS Safari Kullanıyorsanız:</strong><br />
          iOS kuralları gereği bildirim almak için önce Safari menüsünden <b>Paylaş &gt; Ana Ekrana Ekle</b> yaparak Episodio uygulamasını telefonunuza yükleyin.
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300">
          ❌ Bildirim gönderilirken bir hata oluştu. Sayfayı yenileyip tekrar deneyin.
        </div>
      )}
    </div>
  );
}
