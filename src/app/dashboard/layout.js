'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { getCurrentUser, initializeAuth } from '@/store/slices/authSlice';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageLoader from '@/components/Layout/PageLoader';

// Layout مشترك لجميع صفحات الداشبورد
// هذا Layout يطبق DashboardLayout (Sidebar + Header) على جميع الصفحات الفرعية
export default function Layout({ children }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, initialized, loading } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  // تجنب مشاكل Hydration - عرض نفس المحتوى على الخادم والعميل
  useEffect(() => {
    setMounted(true);
    // تهيئة المصادقة
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    // إذا تم التهيئة ولم يكن المستخدم مسجل دخول، إعادة توجيه للـ login
    if (mounted && initialized && !loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, initialized, isAuthenticated, loading, router]);

  useEffect(() => {
    // جلب بيانات المستخدم إذا كان مسجل دخول
    if (mounted && initialized && isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, mounted, initialized, isAuthenticated]);

  const pending = !mounted || !initialized || loading || !isAuthenticated;

  return (
    <>
      {pending ? (
        <div className="hidden lg:flex fixed inset-y-0 right-0 h-screen w-64 flex-col bg-surface border-l border-border">
          <div className="flex h-16 items-center justify-center border-b border-border px-4">
            <h1 className="text-xl font-bold text-text">MediSmile</h1>
          </div>
        </div>
      ) : (
        <DashboardLayout>{children}</DashboardLayout>
      )}
      <PageLoader loading={pending} hasSidebar />
    </>
  );
}
