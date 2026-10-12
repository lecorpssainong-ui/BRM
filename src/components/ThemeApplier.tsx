import { useEffect, useRef } from 'react';
import { useAppSettings } from '@/lib/queries';

export const THEMES = [
  { value: 'cacao', label: 'Cacao & Or', hint: 'Chaleur boisée, signature du centre', swatch: ['#2A1C15', '#B8864B', '#F5EEE6'] },
  { value: 'ocean', label: 'Océan', hint: 'Bleu Atlantique, frais et apaisant', swatch: ['#0E2233', '#4A98BA', '#E9F2F7'] },
  { value: 'foret', label: 'Forêt', hint: 'Vert feuillage, nature et respiration', swatch: ['#16261A', '#7A9E5C', '#EBF3EA'] },
  { value: 'royal', label: 'Royal', hint: 'Violet profond, élégance nocturne', swatch: ['#20172E', '#A884D6', '#F3EEFA'] },
  { value: 'ambre', label: 'Ambre', hint: 'Coucher de soleil béninois', swatch: ['#2D1A12', '#D68A3C', '#FAF0E4'] },
];

export default function ThemeApplier() {
  const { data: settings } = useAppSettings();

  const isForced = settings?.force_global_theme === true;
  const globalTheme = settings?.theme || 'cacao';
  const lastAppliedTheme = useRef<string | null>(null);

  useEffect(() => {
    let activeTheme = globalTheme;
    if (!isForced) {
      const userTheme = localStorage.getItem('brm_user_theme');
      if (userTheme) {
        activeTheme = userTheme;
      }
    }

    if (lastAppliedTheme.current !== activeTheme) {
      lastAppliedTheme.current = activeTheme;
      document.documentElement.dataset.theme = activeTheme;
    }

    const handleThemeChange = () => {
      const local = localStorage.getItem('brm_user_theme');
      const targetTheme = (!isForced && local) ? local : globalTheme;
      if (lastAppliedTheme.current !== targetTheme) {
        lastAppliedTheme.current = targetTheme;
        document.documentElement.dataset.theme = targetTheme;
      }
    };

    window.addEventListener('brm-theme-change', handleThemeChange);
    return () => window.removeEventListener('brm-theme-change', handleThemeChange);
  }, [globalTheme, isForced]);

  return null;
}
