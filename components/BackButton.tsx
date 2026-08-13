'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
  children?: React.ReactNode;
  iconOnly?: boolean;
}

export default function BackButton({
  fallbackHref = '/home',
  className = '',
  children,
  iconOnly = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Tarayıcı geçmişi varsa bir önceki sayfaya dön
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  if (children) {
    return (
      <button type="button" onClick={handleBack} className={className}>
        {children}
      </button>
    );
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleBack}
        className={className || "w-10 h-10 rounded-full bg-[#1A1A1A]/70 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-all select-none"}
        title="Geri Dön"
        aria-label="Geri Dön"
      >
        <span className="material-symbols-outlined text-xl">arrow_back</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className || "inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors select-none"}
      title="Geri Dön"
    >
      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
      <span>Geri Dön</span>
    </button>
  );
}
