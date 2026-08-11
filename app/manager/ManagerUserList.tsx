'use client';

import { useState } from 'react';
import Link from 'next/link';

type UserItem = {
  id: string;
  email?: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
};

export default function ManagerUserList({ users }: { users: UserItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (u.full_name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();

    return name.includes(q) || username.includes(q) || email.includes(q);
  });

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0E0E14] p-5 sm:p-6 shadow-2xl">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C91520]">person</span>
            Kayıtlı Kullanıcılar ({users.length})
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Platforma üye olan tüm kullanıcılar</p>
        </div>

        {/* Canlı Arama Çubuğu */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kullanıcı ara (isim, e-posta)..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#C91520] focus:bg-white/10 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Scroll Edilebilir Kullanıcı Listesi Çerçevesi (Max 15 satır yükseklik) */}
      <div className="overflow-y-auto max-h-[520px] custom-scrollbar pr-1">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-[#0E0E14] border-b border-white/10 text-white/40 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Kullanıcı</th>
              <th className="py-2.5 px-3">Kullanıcı Adı</th>
              <th className="py-2.5 px-3">Kayıt Tarihi</th>
              <th className="py-2.5 px-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-xs text-white/40">
                  {searchQuery ? `"${searchQuery}" ile eşleşen kullanıcı bulunamadı.` : 'Kullanıcı verisi yok.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const name = u.full_name || u.username || u.email || 'Kullanıcı';
                const dateStr = u.created_at
                  ? new Date(u.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Bilinmiyor';

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-white/30 text-sm">person</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-white truncate block max-w-[150px] sm:max-w-[200px]">{name}</span>
                          {u.email && <span className="text-[10px] text-white/35 block truncate">{u.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-white/60 font-medium">
                      @{u.username || u.id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-3 text-white/40">
                      {dateStr}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/u/${u.username || u.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                      >
                        <span>Profili Gör</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
