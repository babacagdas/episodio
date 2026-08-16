import SplashClient from '@/app/SplashClient';

export const metadata = {
  title: 'Giriş Yap | Episodio',
  description: 'Episodio hesabınıza giriş yapın.',
};

export default function SignInPage() {
  return <SplashClient initialModal="signin" />;
}
