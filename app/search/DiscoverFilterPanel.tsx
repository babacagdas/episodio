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
        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm md:bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discover-filter-title"
        className="fixed z-[100] left-0 right-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/10 border-b-0 bg-[#0d0d0d] shadow-2xl
          md:left-auto md:top-0 md:bottom-0 md:right-0 md:max-h-none md:h-full md:w-full md:max-w-md md:rounded-none md:border-l md:border-y-0 md:border-r-0"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0d0d0d]/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 id="discover-filter-title" className="text-lg font-bold text-white tracking-tight">
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

        <div className="flex flex-col gap-8 px-5 py-6 pb-12">
          <section>
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-3">Kategori</p>
            <div className="flex flex-wrap gap-2">
              {FILTER_CATEGORIES.map((cat) => {
                const selected = cat.label === selectedLabel;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setSelectedLabel(cat.label)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition border ${
                      selected
                        ? 'border-[#E50914] bg-[#E50914]/15 text-white'
                        : 'border-white/15 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-3">Yıl</p>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#E50914] focus:outline-none"
            >
              <option value="">Tüm yıllar</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 py-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={busy || !selectedLabel}
              onClick={handleApply}
              className="rounded-xl bg-[#E50914] py-3.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
            >
              {busy ? 'Yükleniyor…' : 'Uygula'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
