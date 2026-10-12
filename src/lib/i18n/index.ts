export * from './LanguageContext';
export { fr } from './locales/fr';
export { en } from './locales/en';
export { hi } from './locales/hi';
export { es } from './locales/es';
export { ar } from './locales/ar';

import { detectInitialLanguage, LANGUAGE_STORAGE_KEY, SupportedLanguage, LANGUAGES } from './LanguageContext';
import { supabase } from '@/lib/supabaseClient';

export function getLanguage(): SupportedLanguage {
  return detectInitialLanguage();
}

export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  if (typeof window === 'undefined') return;
  console.log('Langue changée:', lang);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    localStorage.setItem('brm_app_language', lang);
  } catch {}

  document.documentElement.lang = lang;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  window.dispatchEvent(new CustomEvent('brm-language-change', { detail: { language: lang } }));

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase
        .from('profiles')
        .update({ language: lang, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
    }
  } catch {}
}
