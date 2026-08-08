'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface DeferredClientSectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  delay?: number;
}

export default function DeferredClientSection({
  children,
  fallback = null,
  delay = 250,
}: DeferredClientSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return mounted ? <>{children}</> : <>{fallback}</>;
}
