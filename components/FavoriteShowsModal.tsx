'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
const getTmdbImageUrl = (path: string | null, size = 'w185') => {
  if (!path) return '/no-poster.png';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export interface FavoriteShowItem {
  id: number;
  name: string;
  poster_path: string | null;
}

interface FavoriteShowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFavorites: FavoriteShowItem[];
  onSave: (newFavorites: FavoriteShowItem[]) => Promise<void> | void;
}

export default function FavoriteShowsModal({
  isOpen,
  onClose,
  currentFavorites,
  onSave,
}: FavoriteShowsModalProps) {
  const [selected, setSelected] = useState<FavoriteShowItem[]>(currentFavorites);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FavoriteShowItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(currentFavorites);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, currentFavorites]);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!q.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        }
      } catch (err) {
        console.error('Favorite shows search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleAddShow = (show: FavoriteShowItem) => {
    if (selected.some((s) => s.id === show.id)) return;
    if (selected.length >= 4) return;
    setSelected([...selected, { id: show.id, name: show.name, poster_path: show.poster_path }]);
  };

  const handleRemoveShow = (id: number) => {
    setSelected(selected.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0D0D12]/95 p-5 shadow-2xl backdrop-blur-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık & Kapat Butonu */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Favori 4 Dizini Seç
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Profilinde sergilemek istediğin 4 favori diziyi aratıp ekle
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* 4 Slot Önizleme Alanı */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/40">
              Seçilen Vitrin ({selected.length}/4)
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-[10px] font-bold text-[#C91520] hover:underline"
              >
                Tümünü Temizle
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((index) => {
              const item = selected[index];
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-white/15 bg-white/[0.04] flex items-center justify-center group">
                    {item ? (
                      <>
                        <Image
                          src={item.poster_path ? getTmdbImageUrl(item.poster_path, 'w185') : '/no-poster.png'}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveShow(item.id)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white cursor-pointer"
                          title="Kaldır"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-semibold text-white/30">
                        {index + 1}. Slot
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-white/60 truncate w-full text-center mt-1.5 min-h-[15px]">
                    {item ? item.name : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dizi Arama Girdisi */}
        <div className="space-y-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Dizi adı ara... (Örn: Breaking Bad, Game of Thrones)"
              className="w-full rounded-2xl bg-white/[0.06] border border-white/15 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-[#C91520] focus:outline-none transition-colors"
            />
            {searching && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
          </div>

          {/* Arama Sonuçları */}
          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
            {searchResults.map((show) => {
              const isAdded = selected.some((s) => s.id === show.id);
              const isFull = selected.length >= 4;

              return (
                <div
                  key={show.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-8 h-12 rounded-md overflow-hidden bg-white/10 shrink-0">
                      <Image
                        src={show.poster_path ? getTmdbImageUrl(show.poster_path, 'w92') : '/no-poster.png'}
                        alt={show.name}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <span className="text-xs font-bold text-white truncate">
                      {show.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddShow(show)}
                    disabled={isAdded || isFull}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-white/10 text-white/40 cursor-default'
                        : isFull
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-[#C91520] text-white hover:bg-[#b0111a] active:scale-95'
                    }`}
                  >
                    {isAdded ? 'Eklendi' : isFull ? 'Dolu' : 'Ekle'}
                  </button>
                </div>
              );
            })}

            {searchQuery.trim() && !searching && searchResults.length === 0 && (
              <p className="text-center text-xs text-white/40 py-4">
                Dizi bulunamadı
              </p>
            )}
          </div>
        </div>

        {/* Alt Kaydet Butonu */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold bg-[#C91520] text-white rounded-full hover:bg-[#b0111a] active:scale-95 transition-all shadow-[0_0_15px_rgba(201,21,32,0.4)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              'Vitrini Kaydet'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
