'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Username live check states
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

  useEffect(() => {
    if (!cleanUsername) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameAvailable(false);
      setUsernameMessage('Kullanıcı adı en az 3 karakter olmalı.');
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      setUsernameChecking(false);
      if (data) {
        setUsernameAvailable(false);
        setUsernameMessage(`❌ @${cleanUsername} kullanıcı adı başkası tarafından alınmış!`);
      } else {
        setUsernameAvailable(true);
        setUsernameMessage(`✅ @${cleanUsername} kullanılabilir.`);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [cleanUsername]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Geçerli bir kullanıcı adı girin.');
      return;
    }
    if (usernameAvailable === false) {
      setError('Seçtiğiniz kullanıcı adı başkası tarafından kullanılıyor.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (!acceptedTerms) {
      setError('Devam etmek için KVKK ve Gizlilik Politikası\'nı onaylamalısın.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      
      // Final availability double-check
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing) {
        setError('Bu kullanıcı adı az önce başkası tarafından alındı.');
        setLoading(false);
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            preferred_username: cleanUsername,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (authData.user) {
        await supabase.from('profiles').upsert(
          {
            id: authData.user.id,
            username: cleanUsername,
            full_name: cleanUsername,
            avatar_url: '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }

      setSuccess('Hesabın başarıyla oluşturuldu! Yönlendiriliyorsun...');
      setTimeout(() => router.push('/home'), 1500);
    } catch {
      setError('Kayıt sırasında bağlantı hatası oluştu. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#000000] h-[100dvh] min-h-[100svh] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,21,32,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%)]" />
      </div>

      <main className="relative z-10 w-full max-w-md px-5 py-4 md:px-6 md:py-12">
        <div className="w-full bg-[#141414]/90 backdrop-blur-lg border border-white/10 rounded-xl p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] flex flex-col gap-4 md:gap-6 md:p-9">

          <div className="flex flex-col items-center gap-2 md:gap-3">
            <img alt="Episodio Logo" className="w-[150px] h-auto object-contain md:w-[180px]" src="/logo.png" />
            <p className="text-white/30 text-xs uppercase tracking-[0.2em]">Hesap oluştur</p>
          </div>

          <form className="flex flex-col gap-3 md:gap-4" onSubmit={handleSubmit}>
            {/* Kullanıcı Adı Input */}
            <div className="flex flex-col gap-1">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-white/30 pointer-events-none text-base font-bold">@</span>
                <input
                  className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-10 text-white text-sm placeholder:text-white/20 focus:outline-none transition-colors md:py-3.5 ${
                    usernameAvailable === true
                      ? 'border-green-500/50 focus:border-green-500'
                      : usernameAvailable === false
                      ? 'border-[#C91520]/60 focus:border-[#C91520]'
                      : 'border-white/10 focus:border-[#C91520]/50'
                  }`}
                  placeholder="kullanici_adi"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <div className="absolute right-3 flex items-center">
                  {usernameChecking && (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <span className="material-symbols-outlined text-green-400 text-xl">check_circle</span>
                  )}
                  {!usernameChecking && usernameAvailable === false && (
                    <span className="material-symbols-outlined text-[#C91520] text-xl">cancel</span>
                  )}
                </div>
              </div>
              {usernameMessage && (
                <p className={`text-[11px] px-1 font-medium ${usernameAvailable ? 'text-green-400' : 'text-[#C91520]'}`}>
                  {usernameMessage}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-white/30 pointer-events-none text-xl">email</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:border-[#C91520]/50 focus:outline-none transition-colors md:py-3.5"
                placeholder="E-posta adresi"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Şifre Input */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-white/30 pointer-events-none text-xl">lock</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white text-sm placeholder:text-white/20 focus:border-[#C91520]/50 focus:outline-none transition-colors md:py-3.5"
                placeholder="Şifre oluştur"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>

            {/* Şifre Onay Input */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-white/30 pointer-events-none text-xl">lock</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:border-[#C91520]/50 focus:outline-none transition-colors md:py-3.5"
                placeholder="Şifreyi onayla"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {/* KVKK & Gizlilik Politikası Onayı */}
            <div className="flex items-start gap-2.5 px-1 py-1">
              <input
                id="kvkk-consent"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#1A1A1E] text-[#C91520] focus:ring-[#C91520] focus:ring-offset-0 cursor-pointer accent-[#C91520] shrink-0"
                required
              />
              <label htmlFor="kvkk-consent" className="text-xs text-white/60 leading-normal cursor-pointer select-none">
                <Link href="/kvkk" target="_blank" className="text-[#C91520] hover:underline font-semibold">
                  KVKK Aydınlatma Metni
                </Link>
                {' '}ve{' '}
                <Link href="/privacy" target="_blank" className="text-[#C91520] hover:underline font-semibold">
                  Gizlilik Politikası
                </Link>
                &apos;nı okudum ve kabul ediyorum.
              </label>
            </div>

            {error && <p className="text-xs text-[#C91520] text-center bg-[#C91520]/10 border border-[#C91520]/20 rounded-lg py-2">{error}</p>}
            {success && <p className="text-xs text-green-400 text-center bg-green-400/10 border border-green-400/20 rounded-lg py-2">{success}</p>}

            <button
              type="submit"
              disabled={loading || usernameAvailable === false || usernameChecking || !acceptedTerms}
              className="mx-auto w-full max-w-[230px] bg-[#C91520] text-white font-semibold text-sm py-2.5 rounded-full hover:bg-[#A8121B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 md:py-2.5"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Hesap Oluştur'}
            </button>
          </form>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="px-4 text-white/20 text-xs uppercase tracking-wider">veya</span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              const cleanOrigin = location.origin.replace('//www.', '//');
              await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${cleanOrigin}/auth/callback` } });
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

          <p className="text-center text-xs text-white/30">
            Zaten hesabın var mı?{' '}
            <Link href="/signin" className="text-[#C91520] hover:text-white transition-colors font-medium">Giriş yap</Link>
          </p>

          <p className="text-center text-[11px] text-white/25 pt-1">
            İletişim: <a href="mailto:hello@episodio.com.tr" className="text-white/40 hover:text-white underline">hello@episodio.com.tr</a>
          </p>
        </div>
      </main>
    </div>
  );
}
