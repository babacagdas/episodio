'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SplashClient() {
  const router = useRouter();
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
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
      router.push('/home');
      router.refresh();
    } catch {
      setError('Giriş yapılırken bir sorun oluştu. İnternet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Şifre sıfırlama bağlantısı için e-posta adresinizi girin.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/signin`,
    });
    if (error) {
      setError('Şifre sıfırlama e-postası gönderilemedi.');
    } else {
      setInfo('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    }
  }

  return (
    <div suppressHydrationWarning className="bg-[#000000] h-[100dvh] min-h-[100svh] text-white font-body-md overflow-hidden antialiased relative select-none">
      
      {/* Premium Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <img
          alt=""
          className="w-full h-full object-cover opacity-95 scale-105 transition-transform duration-1000"
          src="/splash_bg.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 z-10" />
      </div>

      {/* Main Container */}
      <main className="relative z-20 flex h-full w-full flex-col items-center justify-between px-6 py-8 md:py-12">
        
        {/* Top Spacer */}
        <div className="flex-1 w-full" />

        {/* Center Brand Area */}
        <div className="flex flex-col items-center text-center max-w-md w-full my-auto z-20">
          <img
            alt="Episodio Logo"
            className="w-[240px] sm:w-[320px] md:w-[380px] h-auto object-contain drop-shadow-[0_10px_25px_rgba(201,21,32,0.3)]"
            src="/logo.png"
          />
        </div>

        {/* Bottom Action Area (Compact & Elegant Buttons) */}
        <div className="flex-1 flex flex-col items-center justify-end w-full gap-2.5 pb-4 z-20">
          <button
            onClick={() => setShowSignInModal(true)}
            className="w-full max-w-[170px] sm:max-w-[190px] bg-[#C91520] hover:bg-[#E21825] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-[0_4px_20px_rgba(201,21,32,0.4)] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>Giriş Yap</span>
          </button>

          <Link
            href="/signup"
            className="w-full max-w-[170px] sm:max-w-[190px] bg-white/[0.04] text-white/90 border border-white/10 hover:border-white/20 font-bold text-xs py-2.5 px-5 rounded-full hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1.5 backdrop-blur-md active:scale-95 text-center"
          >
            <span>Hesap Oluştur</span>
          </Link>

          <Link
            href="/search"
            className="mt-2 text-[11px] font-medium text-white/40 hover:text-white/80 transition-colors flex items-center gap-1"
          >
            <span>Misafir Olarak Göz At</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        </div>
      </main>

      {/* Glassmorphic Bottom Sheet Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          
          {/* Backdrop Click to Close */}
          <div className="absolute inset-0" onClick={() => setShowSignInModal(false)} />

          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-[#0D0D0E]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl backdrop-blur-xl z-10 animate-slideUp">
            
            {/* Top Handle Indicator */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">Tekrar Hoş Geldin!</h3>
                <p className="text-xs text-white/50">Hesabına giriş yap ve dizilerine devam et.</p>
              </div>
              <button
                onClick={() => setShowSignInModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Error / Info Alerts */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#C91520]/15 border border-[#C91520]/30 text-xs text-red-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#C91520]">error</span>
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-emerald-400">info</span>
                <span>{info}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@domain.com"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-[#C91520] text-white text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50">
                    Şifre
                  </label>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-[11px] font-semibold text-[#C91520] hover:underline"
                  >
                    Şifremi Unuttum?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-[#C91520] text-white text-xs rounded-xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C91520] hover:bg-[#E21825] text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Giriş Yap</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Modal Footer */}
            <div className="mt-5 pt-4 border-t border-white/5 text-center text-xs text-white/50">
              Hesabın yok mu?{' '}
              <Link href="/signup" className="font-bold text-white hover:text-[#C91520] transition-colors underline ml-1">
                Kayıt Ol
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
