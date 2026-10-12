export interface ActivityLogEntry {
  id: string;
  table: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'purge' | 'role_change';
  description: string;
  timestamp: string;
  user_email?: string;
}

const STORAGE_KEY = 'brm_activity_log';

export function getStoredActivities(): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading activity log:', e);
  }
  return [
    {
      id: 'log_seed_1',
      table: 'AppSettings',
      action: 'update',
      description: 'Initialisation et synchronisation des paramètres du centre',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      user_email: 'contact@benin-reflexologie.bj',
    },
    {
      id: 'log_seed_2',
      table: 'MassageType',
      action: 'create',
      description: 'Catalogue officiel des soins et réflexologies plantaires actualisé',
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      user_email: 'contact@benin-reflexologie.bj',
    },
    {
      id: 'log_seed_3',
      table: 'User',
      action: 'login',
      description: 'Initialisation du centre Bénin Réflexologie Massage',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      user_email: 'contact@benin-reflexologie.bj',
    },
  ];
}

export function logActivity(entry: {
  table: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'purge' | 'role_change';
  description: string;
  user_email?: string;
}) {
  try {
    const logs = getStoredActivities();
    const newEntry: ActivityLogEntry = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
    window.dispatchEvent(new CustomEvent('brm-activity-change', { detail: newEntry }));
  } catch (err) {
    console.warn('Could not record activity:', err);
  }
}
