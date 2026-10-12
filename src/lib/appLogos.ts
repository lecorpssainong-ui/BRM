import { AppSettingsData } from '@/api/base44Client';

export const STATIC_LOGO_PATH = '/logo-brm-v2.png';

export interface LogoItem {
  id: string;
  url: string;
  name: string;
  isDefault?: boolean;
}

export function getDefaultLogos(): LogoItem[] {
  return [
    {
      id: 'default_logo_brm',
      url: STATIC_LOGO_PATH,
      name: 'Logo Officiel Bénin Réflexologie Massage',
      isDefault: true,
    },
  ];
}

/**
 * Returns available logos (always returns the static logo)
 */
export function getAllAvailableLogos(_settings?: AppSettingsData | null): LogoItem[] {
  return getDefaultLogos();
}

/**
 * Always returns the static official logo: /logo-brm-v2.png
 * Dynamic changes are totally disabled to ensure 100% Android PWA stability.
 */
export function getActiveLogoUrl(_settings?: AppSettingsData | null): string {
  return STATIC_LOGO_PATH;
}
