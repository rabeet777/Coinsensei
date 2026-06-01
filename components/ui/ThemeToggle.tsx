'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface ThemeToggleProps {
  variant?: 'navbar' | 'floating';
  className?: string;
}

export default function ThemeToggle({ variant = 'navbar', className = '' }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setMounted(true);
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  if (!mounted) {
    if (variant === 'floating') {
      return (
        <div className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border border-[--color-border] bg-[--color-surface-card] shadow-lg opacity-20 ${className}`} />
      );
    }
    return (
      <div className={`w-10 h-10 rounded-full border border-[--color-border] bg-transparent opacity-20 ${className}`} />
    );
  }

  if (variant === 'floating') {
    return (
      <button
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-[--color-surface-card] text-[--color-text-pri] border-2 border-[--color-primary] shadow-xl hover:bg-[--color-surface-mid] hover:scale-110 active:scale-95 cursor-pointer transition-all duration-200 ${className}`}
        aria-label="Toggle theme"
      >
        <Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} size={24} className="text-[--color-primary]" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`w-10 h-10 flex items-center justify-center rounded-full border border-[--color-border] hover:border-[--color-primary] text-[--color-text-sec] hover:text-[--color-primary] hover:bg-[--color-primary]/5 transition-all duration-200 cursor-pointer active:scale-95 ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} size={20} />
    </button>
  );
}

