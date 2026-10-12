import { useEffect, useState } from 'react';

export type DataPreference = 'wifi' | 'always' | 'manual' | 'never';

const KEY = 'brm_data_pref';

export const isWifi = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!conn) return true;
  if (conn.saveData) return false;
  if (conn.type) {
    return conn.type === 'wifi' || conn.type === 'ethernet';
  }
  return conn.effectiveType === '4g';
};

export const getDataPref = (): DataPreference => {
  try {
    return (localStorage.getItem(KEY) as DataPreference) || 'wifi';
  } catch {
    return 'wifi';
  }
};

export const setDataPref = (pref: DataPreference): void => {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('brm-data-pref'));
};

export const canAutoplay = (pref: DataPreference): boolean => {
  if (pref === 'always') return true;
  if (pref === 'wifi') return isWifi();
  return false;
};

export const canPrefetch = (pref: DataPreference): boolean => {
  return pref === 'always';
};

export const canCacheOnView = (pref: DataPreference): boolean => {
  if (pref === 'always') return true;
  if (pref === 'wifi') return isWifi();
  return false;
};

export function useDataPref(): [DataPreference, (p: DataPreference) => void] {
  const [pref, setPref] = useState<DataPreference>(getDataPref);

  useEffect(() => {
    const handler = () => setPref(getDataPref());
    window.addEventListener('brm-data-pref', handler);
    return () => window.removeEventListener('brm-data-pref', handler);
  }, []);

  return [pref, setDataPref];
}
