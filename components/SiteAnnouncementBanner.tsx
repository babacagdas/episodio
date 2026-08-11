'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Announcement = {
  id: string;
  is_active: boolean;
  message: string;
  type: string;
  link?: string;
};

export default function SiteAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/manager/announcement');
        if (!res.ok) return;
        const data: Announcement = await res.json();

        if (data && data.is_active && data.message.trim()) {
          const isDismissed = sessionStorage.getItem(`dismissed_announcement_${data.id}`) === 'true';
          if (!isDismissed) {
            setAnnouncement(data);
            setDismissed(false);
          }
        }
      } catch {
        // continue
      }
    }
    fetchAnnouncement();
  }, []);

  if (dismissed || !announcement || !announcement.is_active || !announcement.message) {
    return null;
  }

  function handleDismiss() {
    if (announcement) {
      sessionStorage.setItem(`dismissed_announcement_${announcement.id}`, 'true');
    }
    setDismissed(true);
  }

  // Tema Renkleri
  const themeClasses = {
    info: 'from-[#C91520] via-[#9B0F18] to-[#C91520] border-[#C91520]/40 text-white shadow-[0_4px_25px_rgba(201,21,32,0.35)]',
    warning: 'from-amber-600 via-amber-700 to-amber-600 border-amber-400/40 text-white shadow-[0_4px_25px_rgba(217,119,6,0.35)]',
    danger: 'from-red-700 via-red-800 to-red-700 border-red-500/50 text-white shadow-[0_4px_25px_rgba(220,38,38,0.4)]',
    success: 'from-emerald-600 via-emerald-700 to-emerald-600 border-emerald-400/40 text-white shadow-[0_4px_25px_rgba(5,150,105,0.35)]',
  }[announcement.type || 'info'] || 'from-[#C91520] via-[#9B0F18] to-[#C91520] text-white';

  const content = (
    <div className="flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-bold tracking-wide leading-tight py-2 px-3">
      <span className="material-symbols-outlined text-base shrink-0 animate-bounce">campaign</span>
      <span className="truncate">{announcement.message}</span>
      {announcement.link && (
        <span className="inline-flex items-center gap-0.5 text-[11px] underline underline-offset-2 opacity-90 hover:opacity-100 shrink-0 ml-1">
          <span>İncele</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </span>
      )}
    </div>
  );

  return (
    <div className={`relative z-[60] w-full bg-gradient-to-r ${themeClasses} border-b backdrop-blur-md transition-all duration-300`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-0.5">
        
        {/* Banner Metni veya Link */}
        <div className="flex-1 min-w-0">
          {announcement.link ? (
            <Link
              href={announcement.link}
              target={announcement.link.startsWith('http') ? '_blank' : '_self'}
              className="block hover:opacity-95 transition-opacity"
            >
              {content}
            </Link>
          ) : (
            content
          )}
        </div>

        {/* Kapat Butonu */}
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/20 text-white/80 transition-colors hover:bg-black/40 hover:text-white"
          aria-label="Kapat"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

      </div>
    </div>
  );
}
