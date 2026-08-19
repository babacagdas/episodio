'use client';

import { useState } from 'react';
import UserReviewsModal from '@/components/UserReviewsModal';

interface Props {
  userId: string;
  username: string;
  avatarUrl?: string;
  reviewCount: number;
  watchedStatValue: number | string;
  watchTimeStatValue: string;
  isDesktop?: boolean;
}

export default function UserReviewsClientSection({
  userId,
  username,
  avatarUrl,
  reviewCount,
  watchedStatValue,
  watchTimeStatValue,
  isDesktop = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const stats = [
    { val: watchedStatValue, label: 'İzlendi', onClick: undefined },
    { val: reviewCount, label: 'Yorum', onClick: () => setIsOpen(true) },
    { val: watchTimeStatValue, label: 'İzleme Süresi', onClick: undefined },
  ];

  if (isDesktop) {
    return (
      <>
        {stats.map(({ val, label, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`text-center ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
          >
            <span className={`block text-2xl font-extrabold ${label === 'İzleme Süresi' ? 'text-[#D4A017]' : 'text-white'}`}>{val}</span>
            <span className="text-[11px] text-white/30 uppercase tracking-wider">{label}</span>
          </div>
        ))}

        <UserReviewsModal
          userId={userId}
          username={username}
          avatarUrl={avatarUrl}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 md:hidden">
        {[
          { val: watchedStatValue, label: 'İzlendi', onClick: undefined },
          { val: watchTimeStatValue, label: 'İzleme Süresi', onClick: undefined },
          { val: reviewCount, label: 'Yorum', onClick: () => setIsOpen(true) },
        ].map(({ val, label, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`text-center ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
          >
            <span className={`block text-base font-extrabold ${label === 'İzleme Süresi' ? 'text-[#D4A017]' : 'text-white'}`}>{val}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      <UserReviewsModal
        userId={userId}
        username={username}
        avatarUrl={avatarUrl}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
