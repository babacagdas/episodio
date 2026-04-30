'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('E-posta veya şifre hatalı.');
        return;
      }

      router.push('/home');
      router.refresh();
    } catch {
      setError('Giriş sırasında bağlantı hatası oluştu. İnterneti kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-3/4 h-3/4 bg-[#E50914] rounded-full mix-blend-screen filter blur-[150px] opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-[#c59300] rounded-full mix-blend-screen filter blur-[150px] opacity-10" />
      </div>

      <main className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="w-full bg-[#141414]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-8 md:p-10 shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col gap-7">

          <div className="flex flex-col items-center gap-3">
            <img alt="Episodio Logo" className="h-14 w-auto object-contain" src="/logo.png" />
            <p className="text-white/30 text-xs uppercase tracking-[0.2em]">Hesabına giriş yap</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-white/30 pointer-events-none text-xl">email</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors"
                placeholder="E-posta adresi"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-white/30 pointer-events-none text-xl">lock</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors"
                placeholder="Şifre"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>

            <div className="flex justify-end">
              <a className="text-xs text-[#E50914] hover:text-white transition-colors" href="#">Şifremi unuttum</a>
            </div>

            {error && <p className="text-xs text-[#E50914] text-center bg-[#E50914]/10 border border-[#E50914]/20 rounded-lg py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E50914] text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,9,20,0.3)]"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Giriş Yap'}
            </button>
          </form>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="px-4 text-white/20 text-xs uppercase tracking-wider">veya</span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } });
              }}
              className="w-full bg-white text-[#1F1F1F] border border-white/10 hover:bg-[#F5F5F5] rounded-xl py-3 flex items-center justify-center gap-3 transition-colors text-sm font-medium"
            >
              <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.7 16.1 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.7 5.6l6.2 5.2C40.5 35.4 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Google ile devam et
            </button>
          </div>

          <p className="text-center text-xs text-white/30">
            Hesabın yok mu?{' '}
            <Link href="/signup" className="text-[#E50914] hover:text-white transition-colors font-medium">Kayıt ol</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
