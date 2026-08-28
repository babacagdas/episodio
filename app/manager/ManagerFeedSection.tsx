'use client';

import { useState, useEffect } from 'react';

interface FeedPost {
  id: string;
  image_url: string;
  title?: string | null;
  caption?: string | null;
  instagram_url?: string | null;
  created_at?: string | null;
}

export default function ManagerFeedSection() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/feed-posts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPosts(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setMessage({ type: 'error', text: 'Lütfen bir görsel bağlantısı (URL) girin.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/feed-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl.trim(),
          title: title.trim() || null,
          caption: caption.trim() || null,
          instagram_url: instagramUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Gönderi Episodio Vitrin\'e başarıyla eklendi!' });
        setImageUrl('');
        setTitle('');
        setCaption('');
        setInstagramUrl('');
        fetchPosts();
      } else {
        setMessage({ type: 'error', text: data.error || 'Gönderi eklenirken hata oluştu.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Bağlantı hatası oluştu.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu vitrin gönderisini siteden kaldırmak istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/feed-posts?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      alert('Silme işlemi başarısız oldu.');
    }
  }

  return (
    <section className="mb-10 rounded-3xl border border-white/10 bg-[#0E0E14] p-5 sm:p-7 shadow-2xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white text-base shadow">
              photo_camera
            </span>
            <span>Episodio Vitrin & Instagram Akışı Yönetimi</span>
          </h2>
          <p className="text-xs text-white/40 mt-1">
            Ana sayfadaki 4:5 Instagram dikey akışına yeni görseller ve haberler yayınlayın.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Yükleme Formu */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-4">
          {message && (
            <div
              className={`rounded-2xl p-4 text-xs font-bold border ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1.5">
              Görsel Bağlantısı / URL (4:5 Format Tavsiye Edilir) *
            </label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://gorsel-adresi.com/resim.jpg"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#e6683c] focus:bg-white/10 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1.5">Başlık (İsteğe Bağlı)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Eylül Ayında Yayınlanacak Diziler 🍿"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#e6683c] focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 mb-1.5">Instagram Gönderi Linki (İsteğe Bağlı)</label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/p/..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#e6683c] focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1.5">Açıklama Metni (İsteğe Bağlı)</label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Gönderinin altında görünecek açıklama yazısı..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#e6683c] focus:bg-white/10 focus:outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#bc1888]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-1"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                <span>Vitrin'de Yayınla</span>
              </>
            )}
          </button>
        </form>

        {/* 📸 Canlı 4:5 Önizleme */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-5 lg:pt-0 lg:pl-7">
          <p className="text-xs font-bold text-white/50 mb-3 self-start">Canlı 4:5 Önizleme:</p>

          <div className="relative w-[220px] aspect-[4/5] rounded-2xl border border-white/15 bg-black overflow-hidden shadow-2xl">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-white/20 p-4 text-center">
                <span className="material-symbols-outlined text-3xl mb-1">image</span>
                <span className="text-[10px]">Görsel URL girildiğinde önizleme burada belirecek</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-3 z-10">
              <p className="text-xs font-bold text-white line-clamp-1">{title || 'Başlık Örneği'}</p>
              <p className="text-[10px] text-white/70 line-clamp-2 mt-0.5">{caption || 'Açıklama örneği...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Yayınlanmış Gönderiler Listesi */}
      <div className="mt-9 border-t border-white/10 pt-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-xs text-[#e6683c]">view_carousel</span>
          Yayındaki Gönderiler ({posts.length})
        </h3>

        {posts.length === 0 ? (
          <p className="text-xs text-white/40 italic py-4">Henüz yayınlanmış bir vitrin gönderisi bulunmuyor.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {posts.map((p) => (
              <div key={p.id} className="relative group aspect-[4/5] rounded-2xl border border-white/10 bg-black overflow-hidden shadow-lg">
                <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="self-end rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600 transition-colors shadow"
                  >
                    <span className="material-symbols-outlined text-xs block">delete</span>
                  </button>
                  <p className="text-[10px] font-bold text-white line-clamp-2">{p.title || 'Başlıksız'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
  );
}
