'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { schoolConfig } from '@/lib/school-config';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
      {(['light', 'dark', 'system'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
            theme === t
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          aria-label={`Switch to ${t} mode`}
          aria-pressed={theme === t}
        >
          {t === 'light' && <Sun className="w-5 h-5" />}
          {t === 'dark' && <Moon className="w-5 h-5" />}
          {t === 'system' && <Monitor className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );
}