import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';
import ProfileContent from './ProfileContent';
import NotificationsBell from '@/app/home/NotificationsBell';

export default function Profile() {
  return (
    <div className="font-body-md text-body-md antialiased pb-24 md:pb-0 min-h-screen overflow-x-hidden">
      <header className="bg-[#0A0A0A]/70 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 top-0 z-50 border-b border-white/5 sticky md:hidden">
        <Link href="/home">
          <img alt="Episodio Logo" className="h-8 w-auto object-contain" src="/logo.png" />
        </Link>
        <NotificationsBell />
      </header>
      <Sidebar />
      <ProfileContent />
    </div>
  );
}
