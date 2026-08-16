import SplashClient from '@/app/SplashClient';

export const metadata = {
  title: 'Hesap Oluştur | Episodio',
  description: 'Episodio topluluğuna katılın, ücretsiz hesap oluşturun.',
};

export default function SignUpPage() {
  return <SplashClient initialModal="signup" />;
}
