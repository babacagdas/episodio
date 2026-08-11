'use client';

import { useState, useEffect, useRef } from 'react';

interface ManagerPinAuthProps {
  children: React.ReactNode;
  adminEmail: string;
}

export default function ManagerPinAuth({ children, adminEmail }: ManagerPinAuthProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Varayılan 6 Haneli Yönetici PIN Kodu (İsteğe bağlı olarak env ile özelleştirilebilir)
  const TARGET_PIN = process.env.NEXT_PUBLIC_MANAGER_PIN || '441905';

  useEffect(() => {
    // Mevcut turlama oturumunda doğrulandı mı kontrol et
    const stored = sessionStorage.getItem('episodio_manager_pin');
    if (stored === 'verified_ok') {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }, []);

  function handleDigitChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(null);

    // Sonraki haneye otomatik odaklan
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 6 Hane tamamlandığında otomatik doğrula
    const fullPin = newPin.join('');
    if (fullPin.length === 6) {
      verifyPin(fullPin);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function verifyPin(enteredPin: string) {
    setLoading(true);
    setTimeout(() => {
      if (enteredPin === TARGET_PIN) {
        sessionStorage.setItem('episodio_manager_pin', 'verified_ok');
        setIsVerified(true);
      } else {
        setError('Hatalı PIN Kodu! Lütfen 6 haneli kodu tekrar deneyin.');
        setPin(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
      setLoading(false);
    }, 400);
  }

  // Yükleme sırasında geçiş parlaması
  if (isVerified === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070709]">
        <span className="w-8 h-8 border-2 border-[#C91520] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Eğer 6 haneli PIN doğrulandıysa gerçek Yönetici Paneli içeriklerini göster
  if (isVerified) {
    return <>{children}</>;
  }

  // PIN Giriş Ekranı (6 Haneli Güvenlik Duvarı)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070709] px-4 py-12 select-none relative overflow-hidden">
      
      {/* Ambient Red Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C91520]/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0E0E14]/90 p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        
        {/* Güvenlik İkonu */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C91520]/20 text-[#C91520] border border-[#C91520]/30 shadow-[0_0_30px_rgba(201,21,32,0.3)]">
          <span className="material-symbols-outlined text-3xl">shield_lock</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Yönetici Güvenlik Doğrulaması</h1>
        <p className="mt-1.5 text-xs text-white/50 leading-relaxed">
          Giriş yapılan e-posta: <strong className="text-white font-bold">{adminEmail}</strong>
        </p>
        <p className="mt-1 text-[11px] text-[#C91520] font-bold">
          Lütfen 6 haneli Yönetici PIN kodunuzu girin.
        </p>

        {/* 6 Haneli PIN Kutuları */}
        <div className="mt-7 flex justify-center gap-2 sm:gap-3">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-10 h-12 sm:w-12 sm:h-14 rounded-2xl border bg-[#14141C] text-center text-lg sm:text-xl font-bold text-white transition-all outline-none ${
                error
                  ? 'border-red-500/80 bg-red-500/10 animate-[gentleShake_0.3s_ease-in-out]'
                  : digit
                  ? 'border-[#C91520] bg-[#C91520]/15 shadow-[0_0_15px_rgba(201,21,32,0.25)]'
                  : 'border-white/10 focus:border-[#C91520] focus:bg-[#181824]'
              }`}
            />
          ))}
        </div>

        {/* Hata Mesajı */}
        {error && (
          <p className="mt-4 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl py-2 px-3 animate-fade-in">
            {error}
          </p>
        )}

        {/* Bilgilendirme Notu */}
        <div className="mt-8 border-t border-white/10 pt-5 flex items-center justify-between text-[11px] text-white/40">
          <span>Episodio Admin Security</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            E-posta Onaylı
          </span>
        </div>

      </div>
    </div>
  );
}
