'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function BannedUserModal() {
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    async function checkBanStatus() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          if (user.user_metadata?.is_banned === true) {
            setIsBanned(true);
            return;
          }

          // Check profiles table as secondary source
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_banned')
            .eq('id', user.id)
            .maybeSingle();

          if (profile && (profile as any).is_banned === true) {
            setIsBanned(true);
          }
        }
      } catch {
        // continue
      }
    }

    checkBanStatus();
  }, []);

  if (!isBanned) return null;

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/signin';
    } catch {
      window.location.href = '/signin';
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl select-none">
      <div className="w-full max-w-md bg-[#0E0E14] border border-red-500/30 rounded-3xl p-6 text-center shadow-[0_25px_60px_rgba(201,21,32,0.3)] flex flex-col items-center gap-4">
        
        {/* İkon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-500 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse">
          <span className="material-symbols-outlined text-3xl">block</span>
        </div>

        {/* Başlık ve Açıklama */}
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Hesabınız Askıya Alındı 🚫</h2>
          <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed font-medium">
            Topluluk kurallarımıza uyum sağlanmadığı tespit edildiği için hesabınız yönetici tarafından kısıtlanmıştır.
          </p>
        </div>

        {/* Destek Metni */}
        <div className="w-full rounded-2xl bg-white/[0.03] border border-white/5 p-3 text-xs text-white/40">
          İtiraz veya destek için:{' '}
          <a href="mailto:hello@episodio.com.tr" className="text-[#C91520] font-bold hover:underline">
            hello@episodio.com.tr
          </a>
        </div>

        {/* Çıkış Yap Butonu */}
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 w-full py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-[0_4px_20px_rgba(220,38,38,0.4)] active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Oturumu Kapat</span>
        </button>

      </div>
    </div>
  );
}
