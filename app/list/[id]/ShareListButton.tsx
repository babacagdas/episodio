'use client';

import { useState } from 'react';

interface Props {
  title: string;
}

export default function ShareListButton({ title }: Props) {
  const [message, setMessage] = useState('');

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} • Episodio`,
          text: 'Bu dizi listesine göz at:',
          url,
        });
        setMessage('');
        return;
      } catch {
        setMessage('');
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setMessage('Bağlantı kopyalandı.');
      setTimeout(() => setMessage(''), 2200);
    } catch {
      setMessage('Bağlantı kopyalanamadı.');
      setTimeout(() => setMessage(''), 2200);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleShare}
        className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-1.5"
      >
        <span className="material-symbols-outlined text-base">share</span>
        Paylaş
      </button>
      {message && <p className="text-[11px] text-white/45">{message}</p>}
    </div>
  );
}
