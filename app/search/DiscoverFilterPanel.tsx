'use client';

import { useCallback, useEffect, useState } from 'react';

export type FilterCategory =
  | { kind: 'genre'; genreId: number; label: string }
  | { kind: 'origin'; originCountry: string; label: string };

export type PlatformItem = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

// Fallback statik platformlar (TMDB Canlı API ile de beslenir)
const FALLBACK_PLATFORMS: PlatformItem[] = [
  { provider_id: 8, provider_name: 'Netflix', logo_path: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
  { provider_id: 337, provider_name: 'Disney+', logo_path: '/97yvRBw1GzX7fXprcF80er19ot.jpg' },
  { provider_id: 119, provider_name: 'Prime Video', logo_path: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg' },
  { provider_id: 350, provider_name: 'Apple TV', logo_path: '/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg' },
  { provider_id: 150, provider_name: 'BluTV', logo_path: '/47klot430ytIqldQUUx2avN45Sr.jpg' },
  { provider_id: 1750, provider_name: 'TOD', logo_path: '/bFxDjHDXP02u1dLPZfTsTC1L6EA.jpg' },
  { provider_id: 1899, provider_name: 'HBO Max', logo_path: '/jbe4gVSfRlbPTdESXhEKpornsfu.jpg' },
];

export const FILTER_CATEGORIES: FilterCategory[] = [
  { kind: 'genre', genreId: 18, label: 'Drama' },
  { kind: 'genre', genreId: 10759, label: 'Aksiyon' },
  { kind: 'genre', genreId: 35, label: 'Komedi' },
  { kind: 'genre', genreId: 9648, label: 'Gerilim' },
  { kind: 'genre', genreId: 10765, label: 'Bilim Kurgu' },
  { kind: 'genre', genreId: 80, label: 'Suç' },
  { kind: 'genre', genreId: 99, label: 'Belgesel' },
  { kind: 'origin', originCountry: 'TR', label: 'Türk Dizisi' },
  { kind: 'origin', originCountry: 'KR', label: 'Kore Dizisi' },
];

const currentYear = new Date().getFullYear();
const YEARS: number[] = [];
for (let y = currentYear; y >= 1990; y--) YEARS.push(y);

const YEAR_LIST_MAX_HEIGHT = 'min(11rem, 35vh)';

export interface AppliedFilters {
  category: FilterCategory | null;
  year: number | null;
  provider: PlatformItem | null;
}

interface DiscoverFilterPanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: AppliedFilters) => void;
  initial: AppliedFilters | null;
  busy: boolean;
}

export default function DiscoverFilterPanel({ open, onClose, onApply, initial, busy }: DiscoverFilterPanelProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(initial?.category?.label ?? null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(initial?.provider?.provider_id ?? null);
  const [year, setYear] = useState<string>(initial?.year ? String(initial.year) : '');
  const [platforms, setPlatforms] = useState<PlatformItem[]>(FALLBACK_PLATFORMS);

  // TMDB Canlı Platform Listesini Çek
  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/shows/providers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPlatforms(data);
          }
        }
      } catch {
        // Fallback platformlar kullanılır
      }
    }
    fetchProviders();
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedLabel(initial?.category?.label ?? null);
    setSelectedProviderId(initial?.provider?.provider_id ?? null);
    setYear(initial?.year ? String(initial.year) : '');
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleApply = useCallback(() => {
    const cat = FILTER_CATEGORIES.find((c) => c.label === selectedLabel) ?? null;
    const prov = platforms.find((p) => p.provider_id === selectedProviderId) ?? null;
    onApply({ category: cat, year: year ? Number(year) : null, provider: prov });
  }, [onApply, selectedLabel, selectedProviderId, year, platforms]);

  if (!open) return null;

  const canApply = !!selectedLabel || !!selectedProviderId || !!year;

  return (
    <>
      <button
        type="button"
        aria-label="Paneli kapat"
        className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discover-filter-title"
        className="fixed z-[100] left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[min(88vh,calc(100dvh-2rem))]
          flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0E] shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="discover-filter-title" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C91520] text-xl">tune</span>
              Filtreler
            </h2>
            <p className="mt-0.5 text-xs text-white/40">Platform, tür ve yayın yılına göre içerik süz</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white border border-white/10"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-y-contain px-5 py-5 pb-6">
          
          {/* 1. YAYIN PLATFORMU (Dizilerin Detay Sayfasındaki İkonların Birebir Aynısı) */}
          <section>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#D4A017]">live_tv</span>
              Yayın Platformu
            </p>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {platforms.map((p) => {
                const isSelected = selectedProviderId === p.provider_id;
                const logoUrl = p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null;

                return (
                  <button
                    key={p.provider_id}
                    type="button"
                    title={p.provider_name}
                    onClick={() => setSelectedProviderId(isSelected ? null : p.provider_id)}
                    className="flex flex-col items-center gap-1.5 group shrink-0"
                  >
                    <div
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-[#C91520] ring-4 ring-[#C91520]/30 scale-110 shadow-[0_0_20px_rgba(201,21,32,0.5)]'
                          : 'border-white/10 group-hover:border-white/30 bg-[#121216] opacity-75 group-hover:opacity-100'
                      }`}
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={p.provider_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#18181c] text-white/40 text-xs font-bold">
                          {p.provider_name[0]}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10.5px] font-bold transition-colors ${isSelected ? 'text-[#C91520]' : 'text-white/50 group-hover:text-white'}`}>
                      {p.provider_name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. KATEGORİ & TÜR */}
          <section>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-400">category</span>
              Kategori & Tür
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTER_CATEGORIES.map((cat) => {
                const selected = cat.label === selectedLabel;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setSelectedLabel(selected ? null : cat.label)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      selected
                        ? 'bg-[#C91520] border-[#C91520] text-white shadow-[0_2px_12px_rgba(201,21,32,0.4)]'
                        : 'bg-white/[0.04] border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. YIL */}
          <section className="min-h-0 shrink-0">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-sky-400">calendar_month</span>
              Yayın Yılı
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60">
              <div
                className="overflow-y-auto overscroll-y-contain pr-1 custom-scrollbar"
                style={{ maxHeight: YEAR_LIST_MAX_HEIGHT }}
              >
                <button
                  type="button"
                  onClick={() => setYear('')}
                  className={`flex w-full items-center border-b border-white/5 px-4 py-2.5 text-left text-xs font-semibold transition hover:bg-white/[0.04] ${
                    year === '' ? 'text-white bg-white/5' : 'text-white/50'
                  }`}
                >
                  Tüm Yıllar
                  {year === '' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C91520]" />}
                </button>
                {YEARS.map((y) => {
                  const active = String(y) === year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(String(y))}
                      className={`flex w-full items-center border-b border-white/5 px-4 py-2.5 text-left text-xs font-semibold transition last:border-b-0 hover:bg-white/[0.04] ${
                        active ? 'text-white bg-white/5' : 'text-white/50'
                      }`}
                    >
                      {y}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C91520]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => {
                setSelectedLabel(null);
                setSelectedProviderId(null);
                setYear('');
              }}
              className="text-xs font-semibold text-white/40 hover:text-white transition-colors"
            >
              Filtreleri Temizle
            </button>
            <button
              type="button"
              disabled={busy || !canApply}
              onClick={handleApply}
              className="px-6 py-2.5 rounded-full bg-[#C91520] hover:bg-[#E50914] text-white font-bold text-xs transition-all shadow-[0_4px_20px_rgba(201,21,32,0.4)] active:scale-95 disabled:opacity-40"
            >
              {busy ? 'Yükleniyor…' : 'Filtreyi Uygula'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
