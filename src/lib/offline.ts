import { useEffect, useState } from 'react';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const PREFIX = 'brm_cache:';
const OUTBOX = 'brm_outbox';

export const isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine);
export const cacheKeyOf = (queryKey: QueryKey) => JSON.stringify(queryKey);

export function cacheSet(key: string, data: any) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  }
}

export function cacheGet(key: string) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw).data : undefined;
  } catch {
    return undefined;
  }
}

export function clearCache() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

export function useCachedQuery<T = any>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 120000,
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
}) {
  const ck = cacheKeyOf(queryKey);
  return useQuery<T>({
    queryKey,
    enabled,
    staleTime,
    networkMode: 'always',
    retry: 1,
    queryFn: async () => {
      try {
        const data = await queryFn();
        cacheSet(ck, data);
        return data;
      } catch (err) {
        const cached = cacheGet(ck);
        if (cached !== undefined) return cached;
        throw err;
      }
    },
  });
}

/* ── File d'attente hors connexion ── */

export interface OutboxItem {
  id: string;
  entity: string;
  payload: any;
  label: string;
  at: number;
}

const readOutbox = (): OutboxItem[] => {
  try {
    const raw = localStorage.getItem(OUTBOX);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeOutbox = (list: OutboxItem[]) => {
  try {
    localStorage.setItem(OUTBOX, JSON.stringify(list));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('brm-outbox'));
};

export const getOutbox = readOutbox;

export function queueAction(entity: string, payload: any, label: string) {
  const item: OutboxItem = { id: crypto.randomUUID(), entity, payload, label, at: Date.now() };
  writeOutbox([...readOutbox(), item]);
  return item;
}

export const dropQueued = (id: string) => writeOutbox(readOutbox().filter((i) => i.id !== id));

let flushing = false;

export async function flushOutbox() {
  if (flushing || !isOnline()) return 0;
  const list = readOutbox();
  if (!list.length) return 0;
  flushing = true;
  const remaining: OutboxItem[] = [];
  let sent = 0;
  for (const item of list) {
    try {
      if ((base44.entities as any)[item.entity]) {
        await (base44.entities as any)[item.entity].create(item.payload);
        sent += 1;
      }
    } catch {
      remaining.push(item);
    }
  }
  writeOutbox(remaining);
  flushing = false;
  if (sent) window.dispatchEvent(new Event('brm-outbox-sent'));
  return sent;
}

export function useOnline() {
  const [online, setOnline] = useState(isOnline);
  useEffect(() => {
    const up = () => {
      setOnline(true);
      flushOutbox();
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    if (isOnline()) flushOutbox();
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

export function useOutbox() {
  const [list, setList] = useState<OutboxItem[]>(readOutbox);
  useEffect(() => {
    const h = () => setList(readOutbox());
    window.addEventListener('brm-outbox', h);
    return () => window.removeEventListener('brm-outbox', h);
  }, []);
  return list;
}

export async function sendOrQueue(entity: string, payload: any, label: string) {
  if (isOnline()) {
    try {
      if ((base44.entities as any)[entity]) {
        await (base44.entities as any)[entity].create(payload);
        return true;
      }
    } catch {
      // fallback to outbox
    }
  }
  queueAction(entity, payload, label);
  return false;
}
