'use client';

import { useCallback, useEffect, useState } from 'react';

export type FilterCategory =
  | { kind: 'genre'; genreId: number; label: string }
  | { kind: 'origin'; originCountry: string; label: string };

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

/** ~5 satır yıl görünsün; satır yüksekliği ile çarpıldı */
const YEAR_LIST_MAX_HEIGHT = 'min(13.75rem, 45vh)';

export interface AppliedFilters {
  category: FilterCategory;
  year: number | null;
}

interface DiscoverFilterPanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: AppliedFilters) => void;
  initial: AppliedFilters | null;
  busy: boolean;
}

export default function DiscoverFilterPanel({ open, onClose, onApply, initial, busy }: DiscoverFilterPanelProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(initial?.category.label ?? null);
  const [year, setYear] = useState<string>(initial?.year ? String(initial.year) : '');

  useEffect(() => {
    if (!open) return;
    setSelectedLabel(initial?.category.label ?? null);
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
    const cat = FILTER_CATEGORIES.find((c) => c.label === selectedLabel);
    if (!cat) return;
    onApply({ category: cat, year: year ? Number(year) : null });
  }, [onApply, selectedLabel, year]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Paneli kapat"
        className="fixed inset-0 z-[90] bg-black"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discover-filter-title"
        className="fixed z-[100] left-4 right-4 top-[4.75rem] max-h-[min(85vh,calc(100dvh-6rem))]
          md:left-auto md:right-10 md:w-full md:max-w-md md:top-24 lg:top-28
          flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="discover-filter-title" className="text-lg font-bold tracking-tight text-white">
              Filtreler
            </h2>
            <p className="mt-1 h-px w-12 rounded-full bg-[#E50914]" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto overscroll-y-contain px-5 py-6 pb-8">
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Kategori</p>
            <div className="flex flex-wrap gap-x-4 gap-y-3">
              {FILTER_CATEGORIES.map((cat) => {
                const selected = cat.label === selectedLabel;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setSelectedLabel(cat.label)}
                    className={`bg-transparent px-0.5 pb-1 text-left text-xs font-semibold transition ${
                      selected
                        ? 'text-white'
                        : 'text-white/55 hover:text-white/90'
                    }`}
                  >
                    <span className="block pb-1">{cat.label}</span>
                    <span
                      className={`block h-0.5 w-full rounded-full transition ${
                        selected ? 'bg-[#E50914]' : 'bg-[#E50914]/25'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="min-h-0 shrink-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Yıl</p>
            <div className="overflow-hidden rounded-lg bg-black">
              <div
                className="overflow-y-auto overscroll-y-contain pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(229,9,20,0.45)_transparent]"
                style={{ maxHeight: YEAR_LIST_MAX_HEIGHT }}
              >
                <button
                  type="button"
                  onClick={() => setYear('')}
                  className={`flex w-full items-center border-b border-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/[0.04] ${
                    year === '' ? 'text-white' : 'text-white/60'
                  }`}
                >
                  Tüm yıllar
                  {year === '' && <span className="ml-auto h-0.5 w-8 shrink-0 rounded-full bg-[#E50914]" />}
                </button>
                {YEARS.map((y) => {
                  const active = String(y) === year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(String(y))}
                      className={`flex w-full items-center border-b border-white/5 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-white/[0.04] ${
                        active ? 'text-white' : 'text-white/60'
                      }`}
                    >
                      {y}
                      {active && <span className="ml-auto h-0.5 w-8 shrink-0 rounded-full bg-[#E50914]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="mt-auto flex flex-wrap items-center justify-end gap-8 border-t border-white/5 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent pb-1 text-sm font-semibold text-white/60 transition hover:text-white"
            >
              <span className="inline-block border-b-2 border-[#E50914] pb-0.5">Vazgeç</span>
            </button>
            <button
              type="button"
              disabled={busy || !selectedLabel}
              onClick={handleApply}
              className="bg-transparent pb-1 text-sm font-semibold text-white transition hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span className="inline-block border-b-2 border-[#E50914] pb-0.5">{busy ? 'Yükleniyor…' : 'Uygula'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
