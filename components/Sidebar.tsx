'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/search', icon: 'search', label: 'Keşfet' },
  { href: '/watchlist', icon: 'bookmark', label: 'Listem' },
  { href: '/profile', icon: 'person', label: 'Profil' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  return (
    <div className="hidden md:flex fixed left-0 top-0 h-full w-[240px] bg-[#0A0A0A] border-r border-white/5 flex-col py-8 px-6 z-50">
      <span className="text-xl font-black text-white uppercase tracking-tighter font-['Be_Vietnam_Pro'] mb-12 block">
        EPISODIO<span className="text-[#E50914]">.</span>
      </span>
      <nav className="flex flex-col gap-6">
        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 font-label-bold text-label-bold transition-colors ${active ? 'text-[#D4A017]' : 'text-gray-400 hover:text-white'}`}
            >
              <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        {loggedIn && (
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="flex items-center gap-3 text-white/40 hover:text-white transition-colors w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-bold text-label-bold">Çıkış Yap</span>
          </button>
        )}
      </div>
    </div>
  );
}