import { useEffect } from 'react';
import type { ThemeId } from '@/components/ThemeSelector';

const THEME_VARS: Record<ThemeId, Record<string, string>> = {
  'neon-purple': {
    '--background': '222 47% 3%',
    '--card': '222 47% 6%',
    '--secondary': '222 47% 12%',
    '--muted': '222 30% 14%',
    '--primary': '263 93% 58%',
    '--accent': '263 93% 58%',
    '--ring': '263 93% 58%',
    '--border': '222 30% 16%',
    '--input': '222 30% 16%',
    '--neon-purple': '263 93% 58%',
    '--sidebar-background': '222 47% 4%',
    '--sidebar-primary': '263 93% 58%',
    '--sidebar-accent': '222 47% 10%',
    '--sidebar-border': '222 30% 14%',
    '--sidebar-ring': '263 93% 58%',
  },
  'red-black': {
    '--background': '0 0% 4%',
    '--card': '0 0% 7%',
    '--secondary': '0 0% 12%',
    '--muted': '0 0% 14%',
    '--primary': '0 72% 51%',
    '--accent': '0 72% 51%',
    '--ring': '0 72% 51%',
    '--border': '0 0% 16%',
    '--input': '0 0% 16%',
    '--neon-purple': '0 72% 51%',
    '--sidebar-background': '0 0% 5%',
    '--sidebar-primary': '0 72% 51%',
    '--sidebar-accent': '0 0% 10%',
    '--sidebar-border': '0 0% 14%',
    '--sidebar-ring': '0 72% 51%',
  },
  'cyber-blue': {
    '--background': '222 47% 3%',
    '--card': '222 47% 6%',
    '--secondary': '222 47% 12%',
    '--muted': '222 30% 14%',
    '--primary': '217 91% 60%',
    '--accent': '199 89% 48%',
    '--ring': '217 91% 60%',
    '--border': '222 30% 16%',
    '--input': '222 30% 16%',
    '--neon-purple': '217 91% 60%',
    '--sidebar-background': '222 47% 4%',
    '--sidebar-primary': '217 91% 60%',
    '--sidebar-accent': '222 47% 10%',
    '--sidebar-border': '222 30% 14%',
    '--sidebar-ring': '217 91% 60%',
  },
  'emerald': {
    '--background': '160 40% 3%',
    '--card': '160 40% 6%',
    '--secondary': '160 30% 12%',
    '--muted': '160 20% 14%',
    '--primary': '160 84% 39%',
    '--accent': '160 84% 39%',
    '--ring': '160 84% 39%',
    '--border': '160 20% 16%',
    '--input': '160 20% 16%',
    '--neon-purple': '160 84% 39%',
    '--sidebar-background': '160 40% 4%',
    '--sidebar-primary': '160 84% 39%',
    '--sidebar-accent': '160 30% 10%',
    '--sidebar-border': '160 20% 14%',
    '--sidebar-ring': '160 84% 39%',
  },
  'solar': {
    '--background': '30 40% 3%',
    '--card': '30 40% 6%',
    '--secondary': '30 30% 12%',
    '--muted': '30 20% 14%',
    '--primary': '38 92% 50%',
    '--accent': '38 92% 50%',
    '--ring': '38 92% 50%',
    '--border': '30 20% 16%',
    '--input': '30 20% 16%',
    '--neon-purple': '38 92% 50%',
    '--sidebar-background': '30 40% 4%',
    '--sidebar-primary': '38 92% 50%',
    '--sidebar-accent': '30 30% 10%',
    '--sidebar-border': '30 20% 14%',
    '--sidebar-ring': '38 92% 50%',
  },
};

export function useTheme(themeId: string) {
  useEffect(() => {
    const vars = THEME_VARS[themeId as ThemeId] || THEME_VARS['neon-purple'];
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    return () => {
      // Cleanup not needed since we always set a theme
    };
  }, [themeId]);
}
