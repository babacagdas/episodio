'use client';

import { useState, useEffect } from 'react';

type AnnouncementData = {
  is_active: boolean;
  message: string;
  type: string;
  link: string;
};

export default function AnnouncementForm() {
  const [data, setData] = useState<AnnouncementData>({
    is_active: false,
    message: '',
    type: 'info',
    link: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadAnnouncement() {
      setLoading(true);
      try {
        const res = await fetch('/api/manager/announcement');
        const json = await res.json();
        if (json) {
          setData({
            is_active: !!json.is_active,
            message: json.message || '',
            type: json.type || 'info',
            link: json.link || '',
          });
        }
      } catch {
        // continue
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncement();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/manager/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg('Duyuru başarıyla kaydedildi ve sitede yayına alındı!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(json.error || 'Kaydedilirken bir hata oluştu.');
      }
    } catch {
      setErrorMsg('Bağlantı hatası oluştu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0E0E14] p-5 sm:p-6 shadow-2xl">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C91520]">campaign</span>
            Sitede Canlı Duyuru / Banner Yayınla
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Sitenin en üstünde tüm ziyaretçilere ve üyelere görünecek anlık duyuru şeridi.
          </p>
        </div>

        {data.is_active && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Sitede Yayında (Aktif)
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-white/40 gap-2">
          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span>Mevcut duyuru yükleniyor...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Duyuru Metni */}
          <div>
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
              Duyuru Metni
            </label>
            <textarea
              rows={2}
              value={data.message}
              onChange={(e) => setData({ ...data, message: e.target.value })}
              placeholder="Örn: 🎉 Episodio'da yeni haftalık analiz ve dizi karşılaştırma özellikleri aktif! Hemen deneyin."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/25 focus:border-[#C91520] focus:bg-white/10 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Duyuru Tipi / Teması */}
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Duyuru Tipi & Rengi
              </label>
              <select
                value={data.type}
                onChange={(e) => setData({ ...data, type: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#14141C] px-3.5 py-2.5 text-xs text-white focus:border-[#C91520] focus:outline-none transition-all"
              >
                <option value="info">🔴 Kırmızı & Siyah Lüks Tema (Varsayılan)</option>
                <option value="warning">🟡 Altın & Sarı Tema (Özel Duyuru)</option>
                <option value="danger">🚨 Kırmızı Alarm (Bakım / Uyarı)</option>
                <option value="success">🟢 Yeşil Tema (Yeni Güncelleme)</option>
              </select>
            </div>

            {/* Opsiyonel Link */}
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Tıklanabilir Bağlantı / Link (Opsiyonel)
              </label>
              <input
                type="text"
                value={data.link}
                onChange={(e) => setData({ ...data, link: e.target.value })}
                placeholder="Örn: /search veya /home"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-white/25 focus:border-[#C91520] focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>

          </div>

          {/* Yayınlama Durumu Toggle Switch */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <div>
              <span className="text-xs font-bold text-white block">Duyuruyu Sitede Yayınla</span>
              <span className="text-[11px] text-white/40 block">Aktif yapıldığında tüm kullanıcıların en üstünde görünür.</span>
            </div>

            <button
              type="button"
              onClick={() => setData({ ...data, is_active: !data.is_active })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                data.is_active ? 'bg-[#C91520]' : 'bg-white/20'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  data.is_active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Bildirim Mesajları */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Gönder / Kaydet Butonu */}
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#C91520] hover:from-[#f40d1a] hover:to-[#da1824] text-white font-bold text-xs transition-all shadow-[0_4px_20px_rgba(201,21,32,0.35)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                <span>Duyuruyu Kaydet ve Sitede Yayınla</span>
              </>
            )}
          </button>

        </form>
      )}
    </section>
  );
}
