import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fr } from './locales/fr';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { es } from './locales/es';
import { ar } from './locales/ar';

export type SupportedLanguage = 'fr' | 'en' | 'hi' | 'es' | 'ar';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', name: 'Anglais', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'es', name: 'Espagnol', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'ar', name: 'Arabe', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

const DICTIONARIES: Record<SupportedLanguage, any> = {
  fr,
  en,
  hi,
  es,
  ar,
};

export const LANGUAGE_STORAGE_KEY = 'brm-language';
const LEGACY_STORAGE_KEY = 'brm_app_language';

/**
 * Détection automatique de la langue :
 * 1. Préférence stockée dans localStorage ('brm-language')
 * 2. Langue du navigateur (navigator.language)
 * 3. Fallback : 'fr'
 */
export function detectInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'fr';

  try {
    const stored = (localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as SupportedLanguage;
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      return stored;
    }

    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
    let detected: SupportedLanguage = 'fr';
    if (browserLang.startsWith('en')) detected = 'en';
    else if (browserLang.startsWith('hi')) detected = 'hi';
    else if (browserLang.startsWith('es')) detected = 'es';
    else if (browserLang.startsWith('ar')) detected = 'ar';
    else if (browserLang.startsWith('fr')) detected = 'fr';

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, detected);
      localStorage.setItem(LEGACY_STORAGE_KEY, detected);
    } catch {}

    return detected;
  } catch {}

  return 'fr';
}

interface LanguageContextType {
  language: SupportedLanguage;
  currentLang: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(detectInitialLanguage);

  // Applique les attributs DOM lors du changement
  const applyDomAttributes = (lang: SupportedLanguage) => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  };

  useEffect(() => {
    applyDomAttributes(language);
  }, [language]);

  // Écoute des événements externes de changement de langue
  useEffect(() => {
    const handleCustomChange = (e: any) => {
      const newLang = e?.detail?.language as SupportedLanguage;
      if (newLang && LANGUAGES.some((l) => l.code === newLang)) {
        setLanguageState((prev) => (prev !== newLang ? newLang : prev));
      }
    };
    window.addEventListener('brm-language-change', handleCustomChange);
    return () => window.removeEventListener('brm-language-change', handleCustomChange);
  }, []);

  // Écoute de l'utilisateur Supabase pour synchroniser profiles.language s'il est connecté
  useEffect(() => {
    let isMounted = true;

    const syncWithProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', session.user.id)
            .maybeSingle();

          if (isMounted && profile?.language && LANGUAGES.some((l) => l.code === profile.language)) {
            const profileLang = profile.language as SupportedLanguage;
            setLanguageState((prev) => (prev !== profileLang ? profileLang : prev));
            localStorage.setItem(LANGUAGE_STORAGE_KEY, profileLang);
            localStorage.setItem(LEGACY_STORAGE_KEY, profileLang);
            applyDomAttributes(profileLang);
          }
        }
      } catch (err) {
        console.warn('[LanguageProvider] Erreur synchro profil langue:', err);
      }
    };

    syncWithProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted || !session?.user?.id) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', session.user.id)
          .maybeSingle();

        if (isMounted && profile?.language && LANGUAGES.some((l) => l.code === profile.language)) {
          const profileLang = profile.language as SupportedLanguage;
          setLanguageState((prev) => (prev !== profileLang ? profileLang : prev));
          localStorage.setItem(LANGUAGE_STORAGE_KEY, profileLang);
          localStorage.setItem(LEGACY_STORAGE_KEY, profileLang);
          applyDomAttributes(profileLang);
        }
      } catch {}
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Modifie la langue :
   * - Connecté : met à jour localStorage + UPDATE profiles SET language = lang WHERE id = auth.uid()
   * - Non connecté : met à jour localStorage uniquement
   */
  const setLanguage = useCallback(async (newLang: SupportedLanguage) => {
    console.log('Langue changée:', newLang);
    setLanguageState(newLang);
    applyDomAttributes(newLang);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      localStorage.setItem(LEGACY_STORAGE_KEY, newLang);
    } catch {}

    window.dispatchEvent(new CustomEvent('brm-language-change', { detail: { language: newLang } }));

    // Si utilisateur connecté, synchroniser avec profiles
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .update({ language: newLang, updated_at: new Date().toISOString() })
          .eq('id', session.user.id);
      }
    } catch (err) {
      console.warn('[LanguageProvider] Erreur sauvegarde langue en BDD:', err);
    }
  }, []);

  /**
   * Fonction de traduction t('nav.home')
   */
  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = DICTIONARIES[language] || DICTIONARIES.fr;
      const parts = key.split('.');

      let val: any = dict;
      for (const p of parts) {
        if (val && typeof val === 'object' && p in val) {
          val = val[p];
        } else {
          val = undefined;
          break;
        }
      }

      if (typeof val === 'string') return val;

      // Fallback sur le français si non trouvé dans la langue active
      if (language !== 'fr') {
        let frVal: any = DICTIONARIES.fr;
        for (const p of parts) {
          if (frVal && typeof frVal === 'object' && p in frVal) {
            frVal = frVal[p];
          } else {
            frVal = undefined;
            break;
          }
        }
        if (typeof frVal === 'string') return frVal;
      }

      return fallback !== undefined ? fallback : key;
    },
    [language]
  );

  const currentLanguageOption =
    LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        currentLang: language,
        setLanguage,
        t,
        languages: LANGUAGES,
        currentLanguageOption,
        isRtl: language === 'ar',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export const useTranslation = useLanguage;
