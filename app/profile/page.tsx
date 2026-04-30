import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import ProfileContent from './ProfileContent';

export default function Profile() {
  return (
    <div className="font-body-md text-body-md antialiased pb-24 md:pb-0">
      <MobileHeader />
      <Sidebar />
      <ProfileContent />
    </div>
  );
}
