import Link from 'next/link';

export const metadata = {
  title: 'KVKK Aydınlatma Metni | Episodio',
  description: '6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında Aydınlatma Metni',
};

export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center py-10 px-4 md:px-8">
      <div className="w-full max-w-3xl bg-[#121216] border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/signup" className="flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Kayıt Sayfasına Dön</span>
          </Link>
          <img src="/logo.png" alt="Episodio" className="h-6 w-auto" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
            6698 Sayılı KVKK Kapsamında Aydınlatma Metni
          </h1>
          <p className="text-xs text-white/40">Son Güncelleme: 10 Ağustos 2026</p>
        </div>

        {/* Body Content */}
        <div className="space-y-6 text-sm text-white/75 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Veri Sorumlusu</h2>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, <strong>EPISODIO</strong> (&quot;Platform&quot;) olarak kişisel verilerinizi aşağıda açıklanan amaçlar ve sınırlar çerçevesinde işlemekteyiz.
            </p>
            <p className="text-xs text-white/50">
              İletişim E-posta Adresi: <a href="mailto:hello@episodio.com.tr" className="text-[#C91520] underline">hello@episodio.com.tr</a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. İşlenen Kişisel Verileriniz</h2>
            <p>Platformumuzu kullandığınızda işlenen kişisel verileriniz şunlardır:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li><strong>Kimlik ve İletişim Bilgileri:</strong> Kullanıcı adı, e-posta adresi, profil adı ve avatar görseli.</li>
              <li><strong>Kullanım ve İletileşim Verileri:</strong> Takip edilen diziler, izleme durumları (izlendi/izlenecek), oluşturulan listeler, oyuncu tercihleri (swipe/beğeni), yazılan notlar ve yorumlar.</li>
              <li><strong>Sosyal Etkileşim Verileri:</strong> Takipçi / takip edilen kullanıcı ilişkileri, mesajlaşma içerikleri ve bildirim tercihleri.</li>
              <li><strong>Teknik Veriler:</strong> IP adresi, cihaz ve tarayıcı bilgileri, giriş kayıtları (loglar).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li>Kullanıcı hesabınızın oluşturulması, kimlik doğrulamasının yapılması ve güvenliğinin sağlanması.</li>
              <li>Kişiselleştirilmiş dizi önerileri, liste yönetimi ve takip akışının sunulması.</li>
              <li>Platform içi mesajlaşma, bildirim gönderimi ve sosyal etkileşimlerin yürütülmesi.</li>
              <li>Platform performansının iyileştirilmesi, teknik sorunların tespiti ve güvenlik denetimleri.</li>
              <li>Yasal yükümlülüklerimizin yerine getirilmesi.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">4. Kişisel Verilerin Aktarılması</h2>
            <p>
              Kişisel verileriniz, yasal düzenlemelerin öngördüğü haller dışında üçüncü şahıslarla ticari amaçla paylaşılmaz veya satılmaz. Hizmetin sunulabilmesi adına altyapı sağlayıcılarımız (Supabase veritabanı, sunucu hizmetleri) ile yürürlükteki mevzuata uygun olarak güvenli şekilde işlenmektedir.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">5. KVKK Kapsamındaki Haklarınız (Madde 11)</h2>
            <p>KVKK&apos;nın 11. maddesi uyarınca veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme.</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme.</li>
              <li>Kişisel verilerinizin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
              <li>Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme.</li>
              <li>KVKK uyarınca verilerinizin silinmesini veya yok edilmesini isteme.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">6. İletişim ve Başvuru</h2>
            <p>
              Haklarınıza ilişkin taleplerinizi veya sorularınızı e-posta yoluyla direkt olarak <a href="mailto:hello@episodio.com.tr" className="text-[#C91520] font-semibold underline">hello@episodio.com.tr</a> adresine iletebilirsiniz. Başvurularınız en kısa sürede ve en geç 30 gün içinde yanıtlanacaktır.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <span>&copy; 2026 EPISODIO. Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Gizlilik Politikası</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Kayıt Ol</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
