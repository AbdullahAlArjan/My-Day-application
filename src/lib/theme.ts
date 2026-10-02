import { AccentColor, ThemeMode } from '@/types/database';

export const ACCENT_COLORS: Record<AccentColor, { label: string; primary: string; hover: string; lightBg: string; text: string }> = {
  indigo: {
    label: 'Indigo',
    primary: '#4F46E5',
    hover: '#4338CA',
    lightBg: '#EEF2FF',
    text: '#4338CA'
  },
  violet: {
    label: 'Violet',
    primary: '#7C3AED',
    hover: '#6D28D9',
    lightBg: '#F5F3FF',
    text: '#6D28D9'
  },
  blue: {
    label: 'Deep Blue',
    primary: '#2563EB',
    hover: '#1D4ED8',
    lightBg: '#EFF6FF',
    text: '#1D4ED8'
  },
  emerald: {
    label: 'Emerald',
    primary: '#059669',
    hover: '#047857',
    lightBg: '#ECFDF5',
    text: '#047857'
  },
  rose: {
    label: 'Rose',
    primary: '#E11D48',
    hover: '#BE123C',
    lightBg: '#FFF1F2',
    text: '#BE123C'
  },
  amber: {
    label: 'Amber',
    primary: '#D97706',
    hover: '#B45309',
    lightBg: '#FFFBEB',
    text: '#B45309'
  }
};

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const isDark = 
    mode === 'dark' || 
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function applyAccentColor(accent: AccentColor) {
  const colorData = ACCENT_COLORS[accent] || ACCENT_COLORS.indigo;
  const root = document.documentElement;
  root.style.setProperty('--brand-500', colorData.primary);
  root.style.setProperty('--brand-600', colorData.hover);
  root.style.setProperty('--brand-50', colorData.lightBg);
}
