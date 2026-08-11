'use client';

import { useState } from 'react';
import Link from 'next/link';

export type WeeklyData = {
  weekKey: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrentWeek: boolean;
  users: Array<{ id: string; name: string; username: string | null; email?: string | null; avatar_url: string | null; date: string }>;
  lists: Array<{ id: string; name: string; visibility: string | null; creator: string; date: string }>;
  reviews: Array<{ id: string; content: string | null; rating: number | null; reviewer: string; showName?: string; date: string }>;
  watchCount: number;
};

export default function WeeklyAnalyticsClient({ weeks }: { weeks: WeeklyData[] }) {
  const [selectedWeek, setSelectedWeek] = useState<WeeklyData | null>(null);

  return (
    <div className="min-h-screen bg-[#070709] text-[#F4F6FA] select-none pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0E]/90 backdrop-blur-2xl px-4 md:px-10 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Episodio" className="h-7 w-auto object-contain pointer-events-none" />
            <span className="rounded-full bg-[#C91520]/20 border border-[#C91520]/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#C91520]">
              Haftalık Analiz
            </span>
          </div>

          <Link
            href="/manager"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Yönetim Paneline Dön</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 md:px-10 pt-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Haftalık Analiz & Raporlar</h1>
          <p className="mt-1 text-xs sm:text-sm text-white/45">
            Platformun haftalık bazda üye katılımı, yorumlaşma, liste ve izleme aktivitelerinin özeti.
          </p>
        </div>

        {/* Minik Kartlar Izgarası (Grid of Mini Cards) */}
        {weeks.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0E0E14] p-12 text-center text-white/40 text-xs font-semibold">
            Henüz haftalık veri kaydı bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeks.map((w) => (
              <div
                key={w.weekKey}
                onClick={() => setSelectedWeek(w)}
                className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                  w.isCurrentWeek
                    ? 'border-[#C91520]/40 bg-gradient-to-br from-[#C91520]/15 via-[#0E0E14] to-[#0E0E14] shadow-[0_15px_35px_rgba(201,21,32,0.15)]'
                    : 'border-white/10 bg-[#0E0E14] hover:border-white/20 hover:bg-[#12121A]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C91520] text-xl">calendar_today</span>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#C91520] transition-colors">
                      {w.label}
                    </h3>
                  </div>
                  {w.isCurrentWeek && (
                    <span className="rounded-full bg-[#C91520]/20 border border-[#C91520]/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#C91520]">
                      Bu Hafta
                    </span>
                  )}
                </div>

                {/* Minik Özet Metrikleri */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/5 p-2.5">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">person_add</span>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Yeni Üye</p>
                      <p className="text-sm font-black text-white">+{w.users.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/5 p-2.5">
                    <span className="material-symbols-outlined text-amber-400 text-sm">chat</span>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Yorum</p>
                      <p className="text-sm font-black text-white">+{w.reviews.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/5 p-2.5">
                    <span className="material-symbols-outlined text-sky-400 text-sm">visibility</span>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">İzleme</p>
                      <p className="text-sm font-black text-white">+{w.watchCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/5 p-2.5">
                    <span className="material-symbols-outlined text-purple-400 text-sm">format_list_bulleted</span>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase">Liste</p>
                      <p className="text-sm font-black text-white">+{w.lists.length}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-white/40 group-hover:text-white/80 transition-colors">
                  <span>Detaylı Raporu İncele</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Haftalık Detay Modalı (Weekly Detail Modal) */}
      {selectedWeek && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedWeek(null)} />

          <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-[#0E0E14] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#12121C]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C91520] text-xl">analytics</span>
                  <h2 className="text-base sm:text-lg font-bold text-white">{selectedWeek.label} Analizi</h2>
                </div>
                <p className="text-xs text-white/40 mt-0.5">Seçilen haftaya ait detaylı veriler</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWeek(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar flex-1">
              
              {/* 1. Yeni Katılan Üyeler */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  Katılan Üyeler ({selectedWeek.users.length})
                </h3>

                {selectedWeek.users.length === 0 ? (
                  <p className="text-xs text-white/30 italic">Bu hafta yeni üye katılmadı.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {selectedWeek.users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-xs text-white/30">person</span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{u.name}</span>
                            {u.email && <span className="text-[10px] text-white/40 block">{u.email}</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-white/35">{u.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Yazılan Yorumlar & Notlar */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">chat</span>
                  Yazılan Yorumlar & Notlar ({selectedWeek.reviews.length})
                </h3>

                {selectedWeek.reviews.length === 0 ? (
                  <p className="text-xs text-white/30 italic">Bu hafta yorum yazılmadı.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {selectedWeek.reviews.map((r, idx) => (
                      <div key={r.id || idx} className="p-2.5 rounded-xl bg-white/5 text-xs">
                        <div className="flex items-center justify-between text-white/50 text-[10px] mb-1">
                          <span className="font-bold text-white">@{r.reviewer}</span>
                          <span>{r.date}</span>
                        </div>
                        <p className="text-white/80 leading-snug">{r.content || 'İçerik yok'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Oluşturulan Listeler */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                  Oluşturulan Listeler ({selectedWeek.lists.length})
                </h3>

                {selectedWeek.lists.length === 0 ? (
                  <p className="text-xs text-white/30 italic">Bu hafta liste oluşturulmadı.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {selectedWeek.lists.map((l) => (
                      <div key={l.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 text-xs">
                        <div>
                          <span className="font-bold text-white block">{l.name}</span>
                          <span className="text-[10px] text-white/40">Oluşturan: @{l.creator}</span>
                        </div>
                        <span className="text-[10px] text-white/35">{l.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. İzlenen Diziler */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-lg">visibility</span>
                  <span className="text-xs font-bold text-white">İzlenen / Tamamlanan Diziler</span>
                </div>
                <span className="text-sm font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-xl">
                  {selectedWeek.watchCount} İşaretleme
                </span>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
