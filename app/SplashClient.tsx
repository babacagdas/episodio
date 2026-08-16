'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  initialModal?: 'signin' | 'signup' | null;
}

export default function SplashClient({ initialModal = null }: Props) {
  const router = useRouter();
  const [showSignInModal, setShowSignInModal] = useState(initialModal === 'signin');
  const [showSignUpModal, setShowSignUpModal] = useState(initialModal === 'signup');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInInfo, setSignInInfo] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign Up Form State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpSubmitted, setSignUpSubmitted] = useState(false);

  // Username live check states
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  const cleanUsername = signUpUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

  async function handleGoogleSignIn() {
    try {
      const supabase = createClient();
      const cleanOrigin = location.origin.replace('//www.', '//');
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${cleanOrigin}/auth/callback`,
        },
      });
    } catch {
      setSignInError('Google ile giriş yapılırken bir sorun oluştu.');
    }
  }

  // Live username availability check
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
      try {
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(cleanUsername)}`);
        const result = await res.json();
        setUsernameChecking(false);
        setUsernameAvailable(result.available);
        setUsernameMessage(result.message);
      } catch {
        setUsernameChecking(false);
        setUsernameAvailable(true);
        setUsernameMessage(`✅ @${cleanUsername} kullanılabilir.`);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [cleanUsername]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError('');
    setSignInInfo('');
    setSignInLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
      if (error) {
        setSignInError('E-posta veya şifre hatalı.');
        return;
      }
      router.push('/home');
      router.refresh();
    } catch {
      setSignInError('Giriş yapılırken bir sorun oluştu. İnternet bağlantınızı kontrol edin.');
    } finally {
      setSignInLoading(false);
    }
  }

  async function handlePasswordReset() {
    setSignInError('');
    setSignInInfo('');
    if (!signInEmail.trim()) {
      setSignInError('Şifre sıfırlama bağlantısı için e-posta adresinizi girin.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(signInEmail.trim(), {
      redirectTo: `${location.origin}/signin`,
    });
    if (error) {
      setSignInError('Şifre sıfırlama e-postası gönderilemedi.');
    } else {
      setSignInInfo('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSignUpError('');

    if (!cleanUsername || cleanUsername.length < 3) {
      setSignUpError('Geçerli bir kullanıcı adı girin.');
      return;
    }
    if (usernameAvailable === false) {
      setSignUpError('Seçtiğiniz kullanıcı adı başkası tarafından kullanılıyor.');
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (!acceptedTerms) {
      setSignUpError('Devam etmek için KVKK ve Gizlilik Politikası\'nı onaylamalısın.');
      return;
    }

    setSignUpLoading(true);
    try {
      const supabase = createClient();
      const cleanOrigin = location.origin.replace('//www.', '//');

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (existing) {
        setSignUpError('Bu kullanıcı adı az önce başkası tarafından alındı.');
        return;
      }

      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: `${cleanOrigin}/auth/callback`,
          data: {
            preferred_username: cleanUsername,
          },
        },
      });

      if (signUpErr) {
        setSignUpError(signUpErr.message);
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

      setSignUpSubmitted(true);
    } catch {
      setSignUpError('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSignUpLoading(false);
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
            onClick={() => {
              setShowSignUpModal(false);
              setShowSignInModal(true);
            }}
            className="w-full max-w-[170px] sm:max-w-[190px] bg-[#C91520] hover:bg-[#E21825] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-[0_4px_20px_rgba(201,21,32,0.4)] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>Giriş Yap</span>
          </button>

          <button
            onClick={() => {
              setShowSignInModal(false);
              setShowSignUpModal(true);
            }}
            className="w-full max-w-[170px] sm:max-w-[190px] bg-white/[0.04] text-white/90 border border-white/10 hover:border-white/20 font-bold text-xs py-2.5 px-5 rounded-full hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1.5 backdrop-blur-md active:scale-95 cursor-pointer text-center"
          >
            <span>Hesap Oluştur</span>
          </button>

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          
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
            {signInError && (
              <div className="mb-4 p-3 rounded-xl bg-[#C91520]/15 border border-[#C91520]/30 text-xs text-red-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#C91520]">error</span>
                <span>{signInError}</span>
              </div>
            )}
            {signInInfo && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-emerald-400">info</span>
                <span>{signInInfo}</span>
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
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
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
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-[#C91520] text-white text-xs rounded-xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showSignInPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signInLoading}
                className="w-full bg-[#C91520] hover:bg-[#E21825] text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
              >
                {signInLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Giriş Yap</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-3.5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-[#0D0D0E] px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  ya da
                </span>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                </svg>
                <span>Google ile Devam Et</span>
              </button>
            </form>

            {/* Modal Switcher Footer */}
            <div className="mt-5 pt-4 border-t border-white/5 text-center text-xs text-white/50">
              Hesabın yok mu?{' '}
              <button
                onClick={() => {
                  setShowSignInModal(false);
                  setShowSignUpModal(true);
                }}
                className="font-bold text-white hover:text-[#C91520] transition-colors underline ml-1 cursor-pointer"
              >
                Hesap Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Bottom Sheet Sign Up Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          
          {/* Backdrop Click to Close */}
          <div className="absolute inset-0" onClick={() => setShowSignUpModal(false)} />

          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-[#0D0D0E]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl backdrop-blur-xl z-10 animate-slideUp max-h-[90vh] overflow-y-auto">
            
            {/* Top Handle Indicator */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">Aramıza Katıl!</h3>
                <p className="text-xs text-white/50">Dizilerini takip et, yorum yap ve sosyalleş.</p>
              </div>
              <button
                onClick={() => setShowSignUpModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* If Email Submitted */}
            {signUpSubmitted ? (
              <div className="py-6 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#C91520]/15 border border-[#C91520]/30 flex items-center justify-center text-[#C91520] animate-pulse">
                  <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">E-postanızı Kontrol Edin</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Hesabınızı doğrulamak için <strong className="text-white">{signUpEmail}</strong> adresine gönderdiğimiz e-postadaki bağlantıya tıklayın.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSignUpSubmitted(false);
                    setShowSignUpModal(false);
                    setShowSignInModal(true);
                  }}
                  className="w-full bg-[#C91520] text-white font-bold text-xs py-2.5 rounded-xl shadow-lg mt-2 cursor-pointer"
                >
                  Giriş Yap Ekranına Git
                </button>
              </div>
            ) : (
              <>
                {/* Error Alert */}
                {signUpError && (
                  <div className="mb-4 p-3 rounded-xl bg-[#C91520]/15 border border-[#C91520]/30 text-xs text-red-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#C91520]">error</span>
                    <span>{signUpError}</span>
                  </div>
                )}

                {/* Sign Up Form */}
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  {/* Username Field */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                      Kullanıcı Adı
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none">
                        alternate_email
                      </span>
                      <input
                        type="text"
                        required
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        placeholder="kullanici_adi"
                        className="w-full bg-white/[0.04] border border-white/10 focus:border-[#C91520] text-white text-xs rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-white/20"
                      />
                      {usernameChecking && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      )}
                    </div>
                    {usernameMessage && (
                      <p className={`text-[10.5px] mt-1 font-medium ${usernameAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                        {usernameMessage}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                      E-Posta Adresi
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none">
                        mail
                      </span>
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="ornek@domain.com"
                        className="w-full bg-white/[0.04] border border-white/10 focus:border-[#C91520] text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                      Şifre
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none">
                        lock
                      </span>
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="En az 6 karakter"
                        className="w-full bg-white/[0.04] border border-white/10 focus:border-[#C91520] text-white text-xs rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showSignUpPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-white/5 text-[#C91520] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-white/60 leading-tight">
                      <Link href="/kvkk" target="_blank" className="text-white underline font-medium">KVKK</Link> ve{' '}
                      <Link href="/privacy" target="_blank" className="text-white underline font-medium">Gizlilik Politikası</Link>'nı okudum, kabul ediyorum.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={signUpLoading}
                    className="w-full bg-[#C91520] hover:bg-[#E21825] text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-3 cursor-pointer"
                  >
                    {signUpLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Hesap Oluştur</span>
                        <span className="material-symbols-outlined text-sm">person_add</span>
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative my-3.5 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <span className="relative bg-[#0D0D0E] px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      ya da
                    </span>
                  </div>

                  {/* Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                      <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                    </svg>
                    <span>Google ile Devam Et</span>
                  </button>
                </form>

                {/* Modal Switcher Footer */}
                <div className="mt-4 pt-3 border-t border-white/5 text-center text-xs text-white/50">
                  Zaten hesabın var mı?{' '}
                  <button
                    onClick={() => {
                      setShowSignUpModal(false);
                      setShowSignInModal(true);
                    }}
                    className="font-bold text-white hover:text-[#C91520] transition-colors underline ml-1 cursor-pointer"
                  >
                    Giriş Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
