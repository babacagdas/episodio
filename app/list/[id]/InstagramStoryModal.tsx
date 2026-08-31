'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
  description: string | null;
  ownerName: string;
  itemCount: number;
  likesCount: number;
  posters: string[];
}

export default function InstagramStoryModal({
  open,
  onClose,
  listId,
  listName,
  description,
  ownerName,
  itemCount,
  likesCount,
  posters,
}: Props) {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const listUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/list/${listId}`
    : `https://episodio.com.tr/list/${listId}`;

  // Spotify-style 9:16 (1080x1920) Story kartı oluşturma fonksiyonu
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setGenerating(true);

    async function generateCanvasStory() {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // 1. Arka Plan: Derin Sinematik Spotify Siyah/Kırmızı Gradyanı
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
      bgGrad.addColorStop(0, '#140508');
      bgGrad.addColorStop(0.35, '#0B0B0F');
      bgGrad.addColorStop(0.7, '#0F0910');
      bgGrad.addColorStop(1, '#050507');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Kırmızı Sinematik Glow Işıkları (Radial Glow)
      const glowGrad1 = ctx.createRadialGradient(250, 300, 10, 250, 300, 500);
      glowGrad1.addColorStop(0, 'rgba(201, 21, 32, 0.35)');
      glowGrad1.addColorStop(1, 'rgba(201, 21, 32, 0)');
      ctx.fillStyle = glowGrad1;
      ctx.fillRect(0, 0, 1080, 1920);

      const glowGrad2 = ctx.createRadialGradient(850, 1500, 20, 850, 1500, 600);
      glowGrad2.addColorStop(0, 'rgba(201, 21, 32, 0.25)');
      glowGrad2.addColorStop(1, 'rgba(201, 21, 32, 0)');
      ctx.fillStyle = glowGrad2;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Üst Header: Episodio Logosu & Rozeti
      ctx.save();
      // Episodio Kırmızı Etiket
      ctx.fillStyle = 'rgba(201, 21, 32, 0.2)';
      ctx.strokeStyle = 'rgba(201, 21, 32, 0.5)';
      ctx.lineWidth = 3;
      roundRect(ctx, 360, 120, 360, 64, 32, true, true);

      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#C91520';
      ctx.textAlign = 'center';
      ctx.fillText('EPISODIO DİZİ LİSTESİ', 540, 160);
      ctx.restore();

      // 3. Orta Spotify-Style Cam Kart Çerçevesi (Glassmorphic Card Container)
      const cardX = 90;
      const cardY = 230;
      const cardWidth = 900;
      const cardHeight = 1440;
      const cardRadius = 48;

      ctx.save();
      // Kart Arka Planı Gölgesi
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 30;

      // Cam Kart İçi
      ctx.fillStyle = 'rgba(20, 20, 28, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 4;
      roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius, true, true);
      ctx.restore();

      // 4. Afişler Kolajı (4'lü 2x2 veya 1'li Afiş Grid)
      const posterPaths = posters.slice(0, 4);
      const loadedImages: HTMLImageElement[] = [];

      for (const path of posterPaths) {
        if (!path) continue;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const fullUrl = path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w500${path}`;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = fullUrl;
        });
        if (img.complete && img.naturalWidth > 0) {
          loadedImages.push(img);
        }
      }

      // Afiş Grid Çizimi (Kart İçinde Ortalanmış)
      const gridX = cardX + 70;
      const gridY = cardY + 70;
      const gridW = cardWidth - 140; // 760px
      const gridH = 680;

      ctx.save();
      if (loadedImages.length >= 4) {
        // 2x2 Afiş Grid
        const pw = (gridW - 24) / 2; // 368px
        const ph = (gridH - 24) / 2; // 328px
        const coords = [
          { x: gridX, y: gridY },
          { x: gridX + pw + 24, y: gridY },
          { x: gridX, y: gridY + ph + 24 },
          { x: gridX + pw + 24, y: gridY + ph + 24 },
        ];
        loadedImages.slice(0, 4).forEach((img, i) => {
          const { x, y } = coords[i];
          drawRoundedImage(ctx, img, x, y, pw, ph, 24);
        });
      } else if (loadedImages.length >= 1) {
        // Tek Ortalanmış Büyük Afiş
        const pw = 460;
        const ph = 680;
        const px = gridX + (gridW - pw) / 2;
        drawRoundedImage(ctx, loadedImages[0], px, gridY, pw, ph, 28);
      } else {
        // Görsel Yoksa Varsayılan Episodio Logosu
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(ctx, gridX, gridY, gridW, gridH, 28, true, false);
      }
      ctx.restore();

      // 5. Liste Başlığı & Bilgileri
      const textStartY = gridY + gridH + 70;

      // Liste İsmi (Otomatik Satır Kaydırma)
      ctx.save();
      ctx.font = '900 52px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      
      const wrappedTitleLines = wrapText(ctx, listName.toUpperCase(), cardWidth - 140);
      let currentY = textStartY;
      wrappedTitleLines.slice(0, 2).forEach((line) => {
        ctx.fillText(line, 540, currentY);
        currentY += 64;
      });

      // Açıklama Metni (Varsa)
      if (description) {
        ctx.font = '500 28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        const wrappedDesc = wrapText(ctx, description, cardWidth - 160);
        if (wrappedDesc.length > 0) {
          currentY += 15;
          ctx.fillText(wrappedDesc[0], 540, currentY);
        }
      }

      // Hazırlayan / Üye Bilgisi
      currentY += 65;
      ctx.font = '700 30px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#C91520';
      ctx.fillText(`HAZIRLAYAN: @${ownerName.toUpperCase()}`, 540, currentY);

      // Dizi Sayısı & Beğeni Rozeti (Stats Pill)
      currentY += 60;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      const pillText = `🍿 ${itemCount} DİZİ  •  ❤️ ${likesCount} BEĞENİ`;
      ctx.font = '800 24px system-ui, -apple-system, sans-serif';
      const pillWidth = ctx.measureText(pillText).width + 60;
      roundRect(ctx, 540 - pillWidth / 2, currentY - 34, pillWidth, 54, 27, true, true);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(pillText, 540, currentY);
      ctx.restore();

      // 6. En Alt Footer: Spotify Style Link & QR Çağrısı
      ctx.save();
      ctx.font = '800 26px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('episodio.com.tr', 540, 1780);

      ctx.font = '600 20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('Instagram Story için Tasarlandı', 540, 1815);
      ctx.restore();

      if (isMounted) {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setGeneratedImageUrl(dataUrl);
        setGenerating(false);
      }
    }

    generateCanvasStory();

    return () => {
      isMounted = false;
    };
  }, [open, listId, listName, description, ownerName, itemCount, likesCount, posters]);

  if (!open) return null;

  // Instagram Story veya Doğrudan Paylaşma (Web Share API Files Support)
  async function handleShareToInstagramStory() {
    setShareMessage('');
    if (!generatedImageUrl) return;

    try {
      const blob = await (await fetch(generatedImageUrl)).blob();
      const file = new File([blob], `episodio-story-${listId}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${listName} • Episodio`,
          text: `Episodio'da bu dizi listesine göz at: ${listUrl}`,
        });
        return;
      }
    } catch {
      // fallback
    }

    // Mobil cihazda indirilebilir PNG dosyası indir veya bağlantıyı kopyala
    handleDownloadStoryImage();
  }

  function handleDownloadStoryImage() {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `episodio-story-${listName.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setShareMessage('Görsel indirildi! Instagram Story\'e ekleyebilirsin 📸');
    setTimeout(() => setShareMessage(''), 3500);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(listUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareMessage('Bağlantı kopyalanamadı.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Arka Plan Karartması (Backdrop Blur) */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal İçeriği */}
      <div className="relative z-10 w-full max-w-md bg-[#0A0A0E] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center gap-5 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
        
        {/* Üst Kapat Butonu & Başlık */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C91520] text-xl">auto_awesome</span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Instagram Story Kartı
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* 9:16 Spotify Story Önizleme Alanı */}
        <div className="relative w-full max-w-[270px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/60 flex items-center justify-center">
          {generating || !generatedImageUrl ? (
            <div className="flex flex-col items-center gap-3 text-white/40 text-xs">
              <span className="w-7 h-7 border-2 border-[#C91520] border-t-transparent rounded-full animate-spin" />
              <span>Spotify Kartı Tasarlanıyor...</span>
            </div>
          ) : (
            <img
              src={generatedImageUrl}
              alt="Story Preview"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {shareMessage && (
          <p className="text-xs font-bold text-emerald-400 text-center animate-pulse">
            {shareMessage}
          </p>
        )}

        {/* Aksiyon Butonları (Instagram Story & İndirme) */}
        <div className="w-full space-y-2.5 pt-1">
          
          {/* 1. Instagram Story'de Paylaş (Pembe/Mor Instagram Gradyanı) */}
          <button
            type="button"
            onClick={handleShareToInstagramStory}
            disabled={generating}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>Instagram Story'de Paylaş</span>
          </button>

          {/* 2. Görseli İndir (1080x1920 HD PNG) */}
          <button
            type="button"
            onClick={handleDownloadStoryImage}
            disabled={generating}
            className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Görseli İndir (1080x1920 HD)</span>
          </button>

          {/* 3. Bağlantıyı Kopyala (Instagram Link Sticker İçin) */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2 rounded-xl text-white/50 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'link'}</span>
            <span>{copied ? 'Bağlantı Kopyalandı!' : 'Liste Bağlantısını Kopyala (Story Bağlantı Etiketi)'}</span>
          </button>

        </div>

      </div>
    </div>
  );
}

// Yarıçaplı Dikdörtgen Çizim Yardımcısı
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
  stroke: boolean
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Yuvarlatılmış Köşeli Afiş Görseli Çizimi
function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, width, height, radius, false, false);
  ctx.clip();
  ctx.drawImage(img, x, y, width, height);
  ctx.restore();
}

// Metin Kaydırma (Word Wrap)
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
