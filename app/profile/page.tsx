import Link from 'next/link';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { BottomNav, MobileHeader } from '@/components/Nav';
import ProfileContent from './ProfileContent';
import NotificationsBell from '@/app/home/NotificationsBell';

export default function Profile() {
  return (
    <div className="font-body-md text-body-md antialiased pb-24 md:pb-0 pt-[60px] md:pt-0 min-h-screen overflow-x-hidden">
      <MobileHeader rightElement={<NotificationsBell />} />
      <Sidebar />
      <Suspense fallback={<main className="md:ml-[240px] p-8 text-white/40">Profil yükleniyor...</main>}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
