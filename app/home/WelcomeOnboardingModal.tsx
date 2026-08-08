'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function WelcomeOnboardingModal() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);

  const storageKey = useMemo(() => (
    userId ? `episodio_welcome_modal_dismissed_${userId}` : null
  ), [userId]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      setUserId(data.user.id);
      setUserCreatedAt(data.user.created_at ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId || !userCreatedAt || !storageKey) return;

    const createdTime = new Date(userCreatedAt).getTime();
    const isNewUser = Number.isFinite(createdTime)
      ? Date.now() - createdTime < 14 * 24 * 60 * 60 * 1000
      : false;

    if (!isNewUser) return;
    if (window.localStorage.getItem(storageKey) === '1') return;

    const timer = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [storageKey, userCreatedAt, userId]);

  const close = () => {
    if (storageKey) window.localStorage.setItem(storageKey, '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center px-5 py-8">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={close} />

      <div className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#080808]/95 p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.55)] sm:p-7">
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/45 transition-colors hover:border-white/20 hover:text-white"
          aria-label="Kapat"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <img src="/logo.png" alt="Episodio" className="mb-6 h-auto w-[145px] object-contain" />
        <h2 className="font-['Poppins',sans-serif] text-2xl font-extrabold leading-tight tracking-normal text-white sm:text-3xl">
          Merhaba, Episodio'ya hoş geldin.
        </h2>

        <p className="mt-4 text-[14px] font-medium leading-7 text-white/62">
          Profilindeki bilgilerini düzenleyebilir, en sevdiğin dizinin fotoğrafını kapak fotoğrafı yapabilirsin.
          Arkadaşlarınla sevdiğin diziler hakkında konuşabilir, listeler oluşturabilir ve dilediğince yorum yapabilirsin.
        </p>

        <p className="mt-4 text-[14px] font-bold text-white">İyi eğlenceler!</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/profile"
            onClick={close}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#C91520] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#A8121B]"
          >
            Profilimi Düzenle
          </Link>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-5 text-[13px] font-bold text-white/80 transition-colors hover:border-white/20 hover:text-white"
          >
            Şimdi Keşfet
          </button>
        </div>
      </div>
    </div>
  );
}
