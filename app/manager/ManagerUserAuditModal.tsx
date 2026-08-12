'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserItem } from './ManagerUserList';

interface AuditData {
  watched: any[];
  lists: any[];
  reviews: any[];
  notes: any[];
  epDiscussions: any[];
  epReplies: any[];
}

interface ManagerUserAuditModalProps {
  user: UserItem | null;
  onClose: () => void;
  onToggleBan: (userId: string, currentBan: boolean) => void;
}

export default function ManagerUserAuditModal({ user, onClose, onToggleBan }: ManagerUserAuditModalProps) {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'watched' | 'lists' | 'reviews' | 'notes' | 'episode'>('watched');

  useEffect(() => {
    if (!user) return;
    let isSubscribed = true;
    setLoading(true);

    fetch(`/api/manager/user-audit?userId=${user.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (isSubscribed) {
          if (json.error) {
            alert(json.error);
          } else {
            setData(json);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  if (!user) return null;

  async function handleDeleteItem(table: string, id: string, itemLabel: string) {
    if (!confirm(`"${itemLabel}" kaydını silmek istediğinize emin misiniz?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch('/api/manager/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            watched: table === 'watch_status' ? prev.watched.filter((i) => i.id !== id) : prev.watched,
            lists: table === 'lists' ? prev.lists.filter((i) => i.id !== id) : prev.lists,
            reviews: table === 'reviews' ? prev.reviews.filter((i) => i.id !== id) : prev.reviews,
            notes: table === 'show_notes' ? prev.notes.filter((i) => i.id !== id) : prev.notes,
            epDiscussions: table === 'episode_discussions' ? prev.epDiscussions.filter((i) => i.id !== id) : prev.epDiscussions,
            epReplies: table === 'episode_comment_replies' ? prev.epReplies.filter((i) => i.id !== id) : prev.epReplies,
          };
        });
      } else {
        alert(json.error || 'Silme işlemi başarısız oldu.');
      }
    } catch {
      alert('Bağlantı hatası oluştu.');
    } finally {
      setDeletingId(null);
    }
  }

  const name = user.full_name || user.username || user.email || 'Kullanıcı';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0E0E14] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white/[0.03] border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-white/40 text-xl">person</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate">{name}</h3>
                {user.is_banned ? (
                  <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    Banlı
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Aktif
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                {user.username && <span>@{user.username}</span>}
                {user.email && <span>{user.email}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleBan(user.id, !!user.is_banned)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                user.is_banned
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
            >
              {user.is_banned ? 'Banı Kaldır' : 'Kullanıcıyı Banla'}
            </button>
            {user.username && (
              <Link
                href={`/u/${user.username}`}
                target="_blank"
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
                title="Sitede Göster"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
              </Link>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 p-2 bg-white/[0.02] border-b border-white/5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('watched')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'watched' ? 'bg-[#C91520] text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            🎬 İzlenenler ({data?.watched.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('lists')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'lists' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            📋 Listeler ({data?.lists.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'reviews' ? 'bg-amber-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            💬 Yorumlar ({data?.reviews.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'notes' ? 'bg-blue-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            📝 Notlar ({data?.notes.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('episode')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'episode' ? 'bg-emerald-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}
          >
            📺 Bölüm Mesajları ({(data?.epDiscussions.length ?? 0) + (data?.epReplies.length ?? 0)})
          </button>
        </div>

        {/* Modal Content / Items List */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-white/40 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              <span>Kullanıcının geçmiş verileri çekiliyor...</span>
            </div>
          ) : !data ? (
            <div className="py-8 text-center text-xs text-white/40">Veri bulunamadı.</div>
          ) : (
            <>
              {/* 1. İZLENEN DİZİLER */}
              {activeTab === 'watched' && (
                data.watched.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/40">Kullanıcının kaydettiği izleme verisi yok.</div>
                ) : (
                  data.watched.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <span className="font-bold text-xs text-white block">{item.show_name || `Dizi ID: ${item.show_id}`}</span>
                        <span className="text-[10px] text-white/40">Durum: {item.status}</span>
                      </div>
                      <button
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteItem('watch_status', item.id, item.show_name || 'İzleme Kaydı')}
                        className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        İzlemeyi Sil
                      </button>
                    </div>
                  ))
                )
              )}

              {/* 2. LİSTELER */}
              {activeTab === 'lists' && (
                data.lists.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/40">Kullanıcının oluşturduğu liste yok.</div>
                ) : (
                  data.lists.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <span className="font-bold text-xs text-white block">{item.name}</span>
                        <span className="text-[10px] text-white/40">Görünürlük: {item.visibility || 'public'}</span>
                      </div>
                      <button
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteItem('lists', item.id, item.name)}
                        className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Listeyi Sil
                      </button>
                    </div>
                  ))
                )
              )}

              {/* 3. YORUMLAR */}
              {activeTab === 'reviews' && (
                data.reviews.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/40">Kullanıcının yazdığı dizi yorumu yok.</div>
                ) : (
                  data.reviews.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors gap-3">
                      <div className="min-w-0">
                        {item.rating && <span className="text-[10px] font-bold text-amber-400 block mb-1">Puan: ★ {item.rating}</span>}
                        <p className="text-xs text-white/80 italic line-clamp-3 font-medium">"{item.content || 'İçerik yok'}"</p>
                      </div>
                      <button
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteItem('reviews', item.id, 'Dizi Yorumu')}
                        className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
                      >
                        Yorumu Sil
                      </button>
                    </div>
                  ))
                )
              )}

              {/* 4. NOTLAR */}
              {activeTab === 'notes' && (
                data.notes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/40">Kullanıcının yazdığı dizi notu yok.</div>
                ) : (
                  data.notes.map((item) => (
                    <div key={item.id || Math.random()} className="flex items-start justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors gap-3">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-blue-400 block mb-1">{item.show_name || 'Dizi Notu'}</span>
                        <p className="text-xs text-white/80 line-clamp-3 font-medium">"{item.content}"</p>
                      </div>
                      <button
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteItem('show_notes', item.id, item.show_name || 'Dizi Notu')}
                        className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
                      >
                        Notu Sil
                      </button>
                    </div>
                  ))
                )
              )}

              {/* 5. BÖLÜM MESAJLARI VE YANITLARI */}
              {activeTab === 'episode' && (
                (data.epDiscussions.length === 0 && data.epReplies.length === 0) ? (
                  <div className="py-8 text-center text-xs text-white/40">Kullanıcının bölüm yorumu veya yanıtı yok.</div>
                ) : (
                  <div className="space-y-3">
                    {data.epDiscussions.map((item) => (
                      <div key={`d-${item.id}`} className="flex items-start justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-emerald-400 block mb-1">
                            S{item.season_number || 1}E{item.episode_number || 1} Bölüm Yorumu
                          </span>
                          <p className="text-xs text-white/80 italic line-clamp-3 font-medium">"{item.content}"</p>
                        </div>
                        <button
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteItem('episode_discussions', item.id, 'Bölüm Yorumu')}
                          className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                    {data.epReplies.map((item) => (
                      <div key={`rp-${item.id}`} className="flex items-start justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-emerald-400/80 block mb-1">Yorum Yanıtı</span>
                          <p className="text-xs text-white/80 italic line-clamp-3 font-medium">"{item.content}"</p>
                        </div>
                        <button
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteItem('episode_comment_replies', item.id, 'Yorum Yanıtı')}
                          className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
