import Link from 'next/link';

export const metadata = {
  title: 'Gizlilik Politikası | Episodio',
  description: 'Episodio Gizlilik ve Çerez Politikası',
};

export default function PrivacyPage() {
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
            Gizlilik Politikası
          </h1>
          <p className="text-xs text-white/40">Son Güncelleme: 10 Ağustos 2026</p>
        </div>

        {/* Body Content */}
        <div className="space-y-6 text-sm text-white/75 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Gizlilik Taahhüdümüz</h2>
            <p>
              <strong>EPISODIO</strong> olarak kullanıcılarımızın gizliliğine ve kişisel verilerinin korunmasına büyük önem veriyoruz. Bu Gizlilik Politikası, platformumuzu kullanırken verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Toplanan Bilgiler</h2>
            <p>Platformumuzu kullanırken aşağıdaki bilgiler toplanabilir:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li><strong>Hesap Bilgileri:</strong> Kayıt esnasında sağladığınız kullanıcı adı, e-posta adresi ve şifrelenmiş parola verileri.</li>
              <li><strong>Profil ve İçerik Bilgileri:</strong> Biyografi, avatar, oluşturduğunuz dizi listeleri, takip ettiğiniz kullanıcılar, izleme geçmişiniz ve favori oyuncu tercihleriniz.</li>
              <li><strong>Teknik ve Kullanım Verileri:</strong> Giriş zamanları, cihaz türü ve çerezler (cookies) aracılığıyla toplanan anonim oturum verileri.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Bilgilerin Kullanım Amaçları</h2>
            <p>Toplanan veriler yalnızca aşağıdaki durumlar için kullanılır:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li>Hesabınızın yönetilmesi, kişiselleştirilmiş içerik ve dizi önerilerinin sunulması.</li>
              <li>Kullanıcılar arası etkileşimlerin (takip, mesajlaşma, liste paylaşımı) sağlanması.</li>
              <li>Platform güvenliğinin artırılması ve hileli işlemlerin önlenmesi.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">4. Çerezler (Cookies) ve Önbellek</h2>
            <p>
              EPISODIO, oturumunuzun açık kalmasını sağlamak, tercihlerinizi hatırlamak ve sayfa yükleme hızını artırmak amacıyla temel çerezleri kullanır. Tarayıcı ayarlarınızdan çerezleri dilediğiniz zaman engelleyebilirsiniz.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">5. Veri Güvenliği</h2>
            <p>
              Şifreleriniz veritabanımızda kırılması imkansız şifreleme yöntemleriyle saklanır. Verilerinizin yetkisiz erişimlere karşı korunması için endüstri standardı güvenlik önlemleri uygulanmaktadır.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">6. İletişim</h2>
            <p>
              Gizlilik politikamız veya verilerinizle ilgili her türlü soru ve talepleriniz için bizimle iletişime geçebilirsiniz:
            </p>
            <p className="text-xs text-white/60">
              E-posta: <a href="mailto:hello@episodio.com.tr" className="text-[#C91520] font-semibold underline">hello@episodio.com.tr</a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <span>&copy; 2026 EPISODIO. Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-4">
            <Link href="/kvkk" className="hover:text-white transition-colors">KVKK Aydınlatma Metni</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Kayıt Ol</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
