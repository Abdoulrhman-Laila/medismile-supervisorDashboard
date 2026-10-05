'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import PageLoader from './PageLoader';

const MIN_VISIBLE_MS = 450;

function pathFromAnchor(anchor, currentPath) {
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return null;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;

  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;
  const nextPath = url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : url.pathname;
  const activePath = currentPath.length > 1 ? currentPath.replace(/\/$/, '') : currentPath;
  return nextPath === activePath ? null : nextPath;
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const shownAt = useRef(0);

  const startNavigation = () => {
    shownAt.current = Date.now();
    setNavigating(true);
  };

  useEffect(() => {
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    const timer = setTimeout(() => setNavigating(false), remaining);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!navigating) return undefined;
    const timer = setTimeout(() => setNavigating(false), 8000);
    return () => clearTimeout(timer);
  }, [navigating]);

  useEffect(() => {
    const onClick = (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a') : null;
      if (!pathFromAnchor(anchor, pathname)) return;
      startNavigation();
    };

    const originalPushState = history.pushState.bind(history);
    history.pushState = (...args) => {
      const url = args[2];
      if (url != null) {
        try {
          const next = new URL(String(url), window.location.href);
          const nextPath = next.pathname.length > 1 ? next.pathname.replace(/\/$/, '') : next.pathname;
          const activePath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
          if (next.origin === window.location.origin && nextPath !== activePath) {
            startNavigation();
          }
        } catch {
          // عنوان غير صالح لا يبدأ تحميلاً
        }
      }
      return originalPushState(...args);
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      history.pushState = originalPushState;
    };
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PageLoader loading={navigating} hasSidebar />
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-dark/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}














