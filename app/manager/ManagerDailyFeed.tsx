'use client';

import { useState } from 'react';
import Link from 'next/link';

export type DailyUserFeedItem = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type DailyListFeedItem = {
  id: string;
  name: string;
  visibility: string | null;
  creatorName: string;
  created_at: string;
};

export type DailyCommentFeedItem = {
  id: string;
  type: 'review' | 'note' | 'discussion' | 'reply';
  authorName: string;
  content: string | null;
  rating?: number | null;
  titleInfo?: string | null;
  created_at: string;
};

interface ManagerDailyFeedProps {
  users: DailyUserFeedItem[];
  lists: DailyListFeedItem[];
  comments: DailyCommentFeedItem[];
}

export default function ManagerDailyFeed({ users, lists, comments }: ManagerDailyFeedProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'lists' | 'comments'>('all');

  const totalFeedCount = users.length + lists.length + comments.length;

  function getTimeAgo(dateString: string) {
    if (!dateString) return 'Son 24 saat';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Son 24 saat';
    const diffMins = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} saat önce`;
  }

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      {/* Tab Navigasyon */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C91520] text-lg">electric_bolt</span>
          <h4 className="text-sm font-extrabold text-white">Son 24 Saatin Canlı İçerik Akışı</h4>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-[#C91520] text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Tüm Akış ({totalFeedCount})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-emerald-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Üyeler ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('lists')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'lists' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Listeler ({lists.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'comments' ? 'bg-amber-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Yorumlar ({comments.length})
          </button>
        </div>
      </div>

      {/* Akış Listesi Container */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
        {totalFeedCount === 0 ? (
          <div className="p-8 text-center text-xs text-white/40 bg-white/[0.02] rounded-2xl border border-white/5">
            Son 24 saat içerisinde henüz yeni bir içerik veya üye kaydı gerçekleşmedi.
          </div>
        ) : (
          <>
            {/* 1. ÜYELER */}
            {(activeTab === 'all' || activeTab === 'users') &&
              users.map((u) => (
                <div
                  key={`u-${u.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">person_add</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">{u.name}</span>
                        {u.username && <span className="text-[11px] text-white/40 truncate">@{u.username}</span>}
                      </div>
                      {u.email && <span className="text-[10px] text-white/30 block truncate">{u.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-medium text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Yeni Üye
                    </span>
                    <span className="text-[10px] text-white/40">{getTimeAgo(u.created_at)}</span>
                    {u.username && (
                      <Link
                        href={`/u/${u.username}`}
                        target="_blank"
                        className="text-[11px] text-white/40 hover:text-white"
                        title="Profili İncele"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}

            {/* 2. LİSTELER */}
            {(activeTab === 'all' || activeTab === 'lists') &&
              lists.map((l) => (
                <div
                  key={`l-${l.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-white truncate block">{l.name}</span>
                      <span className="text-[10px] text-white/40 block truncate">Oluşturan: @{l.creatorName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-medium text-purple-400/90 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      Yeni Liste
                    </span>
                    <span className="text-[10px] text-white/40">{getTimeAgo(l.created_at)}</span>
                  </div>
                </div>
              ))}

            {/* 3. YORUMLAR */}
            {(activeTab === 'all' || activeTab === 'comments') &&
              comments.map((c) => (
                <div
                  key={`c-${c.id}`}
                  className="flex items-start justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-sm">rate_review</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">@{c.authorName}</span>
                        {c.titleInfo && <span className="text-[10px] text-amber-400/90 font-medium">({c.titleInfo})</span>}
                        {c.rating && <span className="text-[10px] text-amber-400 font-bold">★ {c.rating}</span>}
                      </div>
                      <p className="text-xs text-white/70 mt-1 line-clamp-2 italic">
                        "{c.content || 'İçerik yazılmadı (Sadece puanlama)'}"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-[10px] font-medium text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {c.type === 'review'
                        ? 'Dizi Yorumu'
                        : c.type === 'discussion'
                        ? 'Bölüm Yorumu'
                        : c.type === 'reply'
                        ? 'Yorum Yanıtı'
                        : 'Not'}
                    </span>
                    <span className="text-[10px] text-white/40">{getTimeAgo(c.created_at)}</span>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
