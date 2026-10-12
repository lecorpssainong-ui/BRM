import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import type { QueryClient } from '@tanstack/react-query';

const KEY = 'brm_profile';

export interface ClientProfile {
  client_key: string;
  name: string;
  phone?: string;
  email?: string;
}

export const getProfile = (): ClientProfile | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Strict Session Purge / Clean State:
 * Clears client profile, cart, offline caches, local likes, and flushes React Query memory cache.
 */
export function clearClientSession(queryClient?: QueryClient): void {
  try {
    // 1. Remove profile and client key
    localStorage.removeItem(KEY);

    // 2. Clear personal cart
    localStorage.removeItem('brm_cart');

    // 3. Clear personal likes
    localStorage.removeItem('brm_likes');
    Object.keys(localStorage).forEach((k) => {
      if (
        k.startsWith('brm_likes_') ||
        k.startsWith('brm_offline_') ||
        k.startsWith('brm_draft_') ||
        k === 'brm_outbox'
      ) {
        localStorage.removeItem(k);
      }
    });

    // 4. Reset/Clear in-memory React Query caches
    if (queryClient) {
      queryClient.clear();
      queryClient.resetQueries();
    }

    // 5. Broadcast clean session state to all reactive listeners
    window.dispatchEvent(new Event('brm-profile'));
    window.dispatchEvent(new Event('brm-cart-update'));
    window.dispatchEvent(new Event('brm-likes-update'));
  } catch (err) {
    console.error('Failed to clear client session:', err);
  }
}

export async function saveProfile({
  name,
  phone,
  forceNewKey = false,
}: {
  name: string;
  phone?: string;
  forceNewKey?: boolean;
}): Promise<ClientProfile> {
  const existing = forceNewKey ? null : getProfile();
  const client_key = existing?.client_key || crypto.randomUUID();
  const profile: ClientProfile = { client_key, name, phone };

  try {
    const found = await base44.entities.Client.filter({ client_key });
    if (found[0]) {
      await base44.entities.Client.update(found[0].id, {
        name,
        phone,
        last_seen: new Date().toISOString(),
      });
    } else {
      await base44.entities.Client.create({
        client_key,
        name,
        phone,
        blocked: false,
        last_seen: new Date().toISOString(),
      });
    }
  } catch {
    // offline fallback
  }

  localStorage.setItem(KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event('brm-profile'));
  return profile;
}

export function useProfile(): ClientProfile | null {
  const [profile, setProfile] = useState<ClientProfile | null>(getProfile());

  useEffect(() => {
    const handler = () => {
      const fresh = getProfile();
      setProfile((prev) => {
        if (!prev && !fresh) return prev;
        if (
          prev &&
          fresh &&
          prev.client_key === fresh.client_key &&
          prev.name === fresh.name &&
          prev.phone === fresh.phone
        ) {
          return prev;
        }
        return fresh;
      });
    };
    window.addEventListener('brm-profile', handler);
    return () => window.removeEventListener('brm-profile', handler);
  }, []);

  return profile;
}
