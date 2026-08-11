'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/home';

  useEffect(() => {
    const err = searchParams.get('error');
    const msg = searchParams.get('msg');

    if (msg) {
      setInfo(decodeURIComponent(msg));
    } else if (err) {
      const decodedErr = decodeURIComponent(err);
      if (decodedErr.toLowerCase().includes('pkce') || decodedErr.toLowerCase().includes('code verifier')) {
        setInfo('E-posta doğrulaması tamamlandı. Lütfen e-posta ve şifrenizle giriş yapın.');
      } else {
        setError(decodedErr);
      }
    }

    const code = searchParams.get('code');
    if (code) {
      router.push(`/auth/callback?code=${code}&next=${encodeURIComponent(nextPath)}`);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        router.push(nextPath.startsWith('/') ? nextPath : '/home');
      }
    });
  }, [searchParams, router, nextPath]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('E-posta veya şifre hatalı.');
        return;
      }

      router.push(nextPath.startsWith('/') ? nextPath : '/home');
      router.refresh();
    } catch {
      setError('Giriş sırasında bağlantı hatası oluştu. İnterneti kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Şifre sıfırlama bağlantısı için e-posta adresini yaz.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/signin`,
    });
    if (error) {
      setError('Şifre sıfırlama bağlantısı gönderilemedi.');
      return;
    }
    setInfo('Şifre sıfırlama bağlantısı e-postana gönderildi.');
  }

  return (
    <div className="bg-[#000000] h-[100dvh] min-h-[100svh] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,21,32,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%)]" />
      </div>

      <main className="relative z-10 w-full max-w-md px-5 py-4 md:px-6 md:py-12">
        <div className="w-full bg-[#141414]/90 backdrop-blur-lg border border-white/10 rounded-xl p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] flex flex-col gap-4 md:gap-7 md:p-10">

          <div className="flex flex-col items-center gap-2 md:gap-3">
            <img alt="Episodio Logo" className="w-[150px] h-auto object-contain md:w-[190px]" src="/logo.png" />
            <p className="text-white/30 text-xs uppercase tracking-[0.2em]">Hesabına giriş yap</p>
          </div>

          <form className="flex flex-col gap-3 md:gap-4" onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-white/30 pointer-events-none text-xl">email</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:border-[#C91520]/50 focus:outline-none transition-colors md:py-3.5"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white text-sm placeholder:text-white/20 focus:border-[#C91520]/50 focus:outline-none transition-colors md:py-3.5"
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
              <button type="button" onClick={handlePasswordReset} className="text-xs text-[#C91520] hover:text-white transition-colors">Şifremi unuttum</button>
            </div>

            {error && <p className="text-xs text-[#C91520] text-center bg-[#C91520]/10 border border-[#C91520]/20 rounded-lg py-2">{error}</p>}
            {info && <p className="text-xs text-green-400 text-center bg-green-400/10 border border-green-400/20 rounded-lg py-2">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mx-auto w-full max-w-[210px] bg-[#C91520] text-white font-semibold text-sm py-2.5 rounded-full hover:bg-[#A8121B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 md:py-2.5"
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
                const next = nextPath.startsWith('/') ? nextPath : '/home';
                const cleanOrigin = location.origin.replace('//www.', '//');
                await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${cleanOrigin}/auth/callback?next=${encodeURIComponent(next)}` } });
              }}
              className="w-full bg-white text-[#1F1F1F] border border-white/10 hover:bg-[#F5F5F5] rounded-xl py-2.5 flex items-center justify-center gap-3 transition-colors text-sm font-medium md:py-3"
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
            <Link href="/signup" className="text-[#C91520] hover:text-white transition-colors font-medium">Kayıt ol</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000000]" />}>
      <SignInContent />
    </Suspense>
  );
}
