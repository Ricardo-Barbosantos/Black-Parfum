'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { fbq } from '@/lib/metaPixel';

export default function MetaPixelEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    fbq('track', 'PageView');
  }, [pathname, searchParams]);

  return null;
}
