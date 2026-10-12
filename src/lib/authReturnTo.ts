const RETURN_TO_KEY = 'brm_auth_return_to';

export function setAuthReturnTo(path: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path);
  } catch {}
}

export function getAuthReturnTo(defaultPath = '/'): string {
  if (typeof window === 'undefined') return defaultPath;
  const params = new URLSearchParams(window.location.search);
  const queryReturnTo = params.get('returnTo');
  if (queryReturnTo) return queryReturnTo;

  try {
    const stored = sessionStorage.getItem(RETURN_TO_KEY);
    if (stored) {
      sessionStorage.removeItem(RETURN_TO_KEY);
      return stored;
    }
  } catch {}

  return defaultPath;
}
