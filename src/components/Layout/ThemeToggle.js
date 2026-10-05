'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY = 'theme';

export function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
}

export default function ThemeToggle({ variant = 'default' }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    applyTheme(nextIsDark ? 'dark' : 'light');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`rounded-lg p-2 sm:p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring/20 ${
        variant === 'onDark'
          ? 'border border-border bg-surface text-text hover:bg-primary-muted'
          : 'text-text-secondary hover:bg-primary-muted hover:text-text'
      }`}
      aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      aria-pressed={isDark}
    >
      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
