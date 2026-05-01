'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/search', icon: 'search', label: 'Keşfet' },
  { href: '/watchlist', icon: 'bookmark', label: 'Listem' },
  { href: '/profile', icon: 'person', label: 'Profil' },
];

export function MobileHeader({ rightElement }: { rightElement?: ReactNode }) {
  return (
    <header className="bg-[#0A0A0A]/70 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 top-0 z-50 border-b border-white/5 sticky md:hidden">
      <span className="text-xl font-black text-white uppercase tracking-tighter font-['Be_Vietnam_Pro']">
        EPISODIO<span className="text-[#E50914]">.</span>
      </span>
      {rightElement ?? <span className="material-symbols-outlined text-white cursor-pointer">notifications</span>}
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#1A1A1A]/70 backdrop-blur-2xl fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-3 pt-2 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-lg md:hidden">
      {navItems.map(({ href, icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center justify-center transition-all ${active ? 'text-[#D4A017]' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <span className="material-symbols-outlined mb-0.5 text-[22px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
            <span className="font-['Be_Vietnam_Pro'] text-[9px] font-medium uppercase tracking-widest">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
