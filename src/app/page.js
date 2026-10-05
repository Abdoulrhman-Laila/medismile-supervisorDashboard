'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@/components/Layout/PageLoader';

export default function Home() {
  const router = useRouter();

  // إعادة توجيه مباشر إلى صفحة تسجيل الدخول
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return <PageLoader loading />;
}
