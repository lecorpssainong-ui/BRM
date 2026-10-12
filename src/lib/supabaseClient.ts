import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logActivity } from './activityLogger';

export interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenoms?: string;
  full_name: string;
  telephone?: string;
  phone?: string;
  role: 'moderator' | 'secretary' | 'client';
  avatar_url?: string;
  language?: string;
  theme?: string;
  liked_massages?: string[];
  liked_videos?: string[];
  created_at?: string;
  updated_at?: string;
}

const PROFILES_STORAGE_KEY = 'brm_supabase_profiles';
const AUTH_STORAGE_KEY = 'brm_auth_user';

export const SUPABASE_URL = 'https://rtxqcnduzxmfvewcwfph.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0eHFjbmR1enhtZnZld2N3ZnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODA0MzcsImV4cCI6MjEwNjk1NjQzN30.9jsuYj3FxfmroLY1eP6K8IsdgR6MB-1usMheYUThuw0';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL).trim();
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY).trim().split(/\s+/)[0];

export const isSupabaseConfigured = true;

// Instance officielle prête à l'emploi branchée sur le nouveau Supabase
export const supabase: SupabaseClient = createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'brm-auth-token',
    flowType: 'pkce',
  },
});

export const realSupabase = supabase;

/**
 * Normalisation de texte pour comparaison insensible à la casse et aux accents
 */
export function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function areNamesMatching(nameInput?: string, nameSaved?: string): boolean {
  if (!nameInput || !nameSaved) return false;
  return normalizeText(nameInput) === normalizeText(nameSaved);
}

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00229') && digits.length > 5) {
    digits = digits.slice(5);
  } else if (digits.startsWith('229') && digits.length > 3) {
    digits = digits.slice(3);
  }
  return digits;
}

export function arePhonesMatching(phoneInput?: string, phoneSaved?: string): boolean {
  if (!phoneInput || !phoneSaved) return false;
  const p1 = normalizePhone(phoneInput);
  const p2 = normalizePhone(phoneSaved);
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  const p1Trim = p1.replace(/^0+/, '');
  const p2Trim = p2.replace(/^0+/, '');
  if (p1Trim && p1Trim === p2Trim) return true;
  return false;
}

/**
 * Upload d'un document PDF (factures, bilans, anamnèses) dans le bucket 'documents'
 */
export async function uploadUserDocument(
  userId: string,
  fileName: string,
  fileOrBlob: Blob | File
): Promise<string> {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${cleanFileName}`;

  if (realSupabase) {
    const { error } = await realSupabase.storage
      .from('documents')
      .upload(path, fileOrBlob, {
        upsert: true,
        contentType: 'application/pdf',
      });

    if (error) {
      console.warn('[Storage] Erreur upload document:', error);
      throw error;
    }

    const { data: publicUrlData } = realSupabase.storage
      .from('documents')
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  }

  return URL.createObjectURL(fileOrBlob);
}

/**
 * Gestionnaire persistant des profils locaux
 */
export const profilesStore = {
  getAll(): UserProfile[] {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      let list: UserProfile[] = [];
      if (raw) {
        try {
          list = JSON.parse(raw);
        } catch {
          list = [];
        }
      }

      if (!Array.isArray(list)) list = [];

      // Normalisation stricte de l'enum role pour tous les utilisateurs (défaut 'client')
      list = list.map((p) => {
        let role: 'moderator' | 'secretary' | 'client' = 'client';
        if (p.role && ['moderator', 'secretary', 'client'].includes(p.role)) {
          role = p.role;
        }

        return {
          ...p,
          email: p.email?.trim().toLowerCase(),
          nom: p.nom || p.full_name || p.email?.split('@')[0] || 'Utilisateur',
          full_name: p.full_name || p.nom || p.email?.split('@')[0] || 'Utilisateur',
          telephone: p.telephone || p.phone || '',
          phone: p.phone || p.telephone || '',
          role,
          language: p.language || 'fr',
          theme: p.theme || 'cacao',
          liked_massages: Array.isArray(p.liked_massages) ? p.liked_massages : [],
          liked_videos: Array.isArray(p.liked_videos) ? p.liked_videos : [],
        };
      });

      return list;
    } catch {
      return [];
    }
  },

  setAll(list: UserProfile[]) {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('brm-profiles-change', { detail: { profiles: list } }));
    } catch (e) {
      console.warn('Erreur écriture profiles:', e);
    }
  },

  getByEmail(email: string): UserProfile | null {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    const list = this.getAll();
    return list.find((p) => p.email?.toLowerCase() === clean) || null;
  },

  getById(id: string): UserProfile | null {
    if (!id) return null;
    const list = this.getAll();
    return list.find((p) => p.id === id) || null;
  },

  save(profile: Partial<UserProfile> & { email: string }): UserProfile {
    const list = this.getAll();
    const cleanEmail = profile.email?.trim().toLowerCase();

    const existingIdx = list.findIndex(
      (p) => (p.id && p.id === profile.id) || (p.email && p.email.toLowerCase() === cleanEmail)
    );

    const existing = existingIdx !== -1 ? list[existingIdx] : null;

    let role: 'moderator' | 'secretary' | 'client' = 'client';
    if (profile.role && ['moderator', 'secretary', 'client'].includes(profile.role)) {
      role = profile.role;
    } else if (existing?.role) {
      role = existing.role;
    }

    const nomValue = profile.nom || profile.full_name || existing?.nom || cleanEmail.split('@')[0];
    const telValue = profile.telephone || profile.phone || existing?.telephone || '';

    const toSave: UserProfile = {
      id: existing?.id || profile.id || crypto.randomUUID(),
      email: cleanEmail,
      nom: nomValue,
      full_name: nomValue,
      telephone: telValue,
      phone: telValue,
      role,
      avatar_url: profile.avatar_url || existing?.avatar_url || '',
      language: profile.language || existing?.language || 'fr',
      theme: profile.theme || existing?.theme || 'cacao',
      liked_massages: profile.liked_massages || existing?.liked_massages || [],
      liked_videos: profile.liked_videos || existing?.liked_videos || [],
      created_at: existing?.created_at || profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      list[existingIdx] = toSave;
    } else {
      list.push(toSave);
    }

    this.setAll(list);
    return toSave;
  },

  updateClientInfo(email: string, updates: { nom?: string; telephone?: string }): UserProfile {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.getByEmail(cleanEmail);
    if (!existing) {
      throw new Error('Utilisateur introuvable.');
    }

    const updated: UserProfile = {
      ...existing,
      nom: updates.nom?.trim() || existing.nom,
      full_name: updates.nom?.trim() || existing.full_name,
      telephone: updates.telephone?.trim() ?? existing.telephone,
      phone: updates.telephone?.trim() ?? existing.phone,
      updated_at: new Date().toISOString(),
    };

    return this.save(updated);
  },

  updateUserRole(email: string, newRole: 'moderator' | 'secretary' | 'client'): UserProfile {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.getByEmail(cleanEmail);
    if (!existing) {
      throw new Error(`Aucun utilisateur trouvé pour ${cleanEmail}`);
    }

    existing.role = newRole;
    return this.save(existing);
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((p) => p.id !== id);
    this.setAll(filtered);
    return true;
  },
};

/**
 * Service d'authentification (Supabase + Google)
 */
export const supabaseAuth = {
  async signInWithGoogle(
    email: string,
    nom?: string,
    telephone?: string
  ): Promise<UserProfile> {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanNom = nom?.trim();
    const cleanPhone = telephone?.trim();

    if (!cleanEmail) {
      throw new Error('Veuillez renseigner votre compte Gmail.');
    }
    if (!cleanNom) {
      throw new Error("Veuillez renseigner votre nom d'utilisateur.");
    }
    if (!cleanPhone) {
      throw new Error('Veuillez renseigner votre numéro de téléphone.');
    }

    if (realSupabase) {
      try {
        await realSupabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: false,
          },
        });
      } catch (err) {
        console.warn('[SupabaseAuth] OAuth fallback:', err);
      }
    }

    const existing = profilesStore.getByEmail(cleanEmail);

    if (existing) {
      const isNomCorrect = areNamesMatching(cleanNom, existing.nom || existing.full_name);
      const isPhoneCorrect = arePhonesMatching(cleanPhone, existing.telephone || existing.phone);

      if (!isNomCorrect || !isPhoneCorrect) {
        logActivity({
          table: 'User',
          action: 'login',
          description: `Échec de connexion pour ${cleanEmail} : coordonnées non concordantes`,
          user_email: cleanEmail,
        });

        throw new Error(
          "Informations non concordantes. Le nom d'utilisateur ou le numéro de téléphone ne correspond pas aux informations exactes enregistrées pour ce compte Gmail. En cas d'oubli, veuillez contacter le centre Bénin Réflexologie Massage pour assistance."
        );
      }

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(existing));
      window.dispatchEvent(new Event('brm-auth'));

      logActivity({
        table: 'User',
        action: 'login',
        description: `Connexion réussie de ${existing.nom} (${existing.email}) - Rôle : ${existing.role}`,
        user_email: existing.email,
      });

      return existing;
    } else {
      // Tout nouveau profil est créé avec le rôle 'client'
      const newProfile = profilesStore.save({
        email: cleanEmail,
        nom: cleanNom,
        full_name: cleanNom,
        telephone: cleanPhone,
        phone: cleanPhone,
        role: 'client',
      });

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
      window.dispatchEvent(new Event('brm-auth'));

      logActivity({
        table: 'User',
        action: 'create',
        description: `Création du compte client Google pour ${cleanNom} (${cleanEmail})`,
        user_email: cleanEmail,
      });

      return newProfile;
    }
  },

  async signIn(email: string, nom?: string, telephone?: string): Promise<UserProfile> {
    return this.signInWithGoogle(email, nom, telephone);
  },

  async signUp(data: {
    email: string;
    nom: string;
    telephone: string;
  }): Promise<UserProfile> {
    return this.signInWithGoogle(data.email, data.nom, data.telephone);
  },

  async signOut(): Promise<void> {
    if (realSupabase) {
      try {
        await realSupabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    const current = await this.getCurrentUser();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event('brm-auth'));
    if (current?.email) {
      logActivity({
        table: 'User',
        action: 'login',
        description: `Déconnexion de ${current.email}`,
        user_email: current.email,
      });
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (cached && cached.email) {
        const fresh = profilesStore.getByEmail(cached.email);
        if (fresh) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fresh));
          return fresh;
        }
      }
      return cached;
    } catch {
      return null;
    }
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    return profilesStore.getAll();
  },

  async getTeamMembers(): Promise<UserProfile[]> {
    const list = profilesStore.getAll();
    return list.filter((p) => p.role === 'moderator' || p.role === 'secretary');
  },

  async assignTeamRole(
    email: string,
    role: 'secretary' | 'moderator' | 'client',
    nom?: string,
    telephone?: string
  ): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    let existing = profilesStore.getByEmail(cleanEmail);

    if (existing) {
      existing.role = role;
      if (nom) existing.nom = nom;
      if (telephone) existing.telephone = telephone;
      existing = profilesStore.save(existing);
    } else {
      existing = profilesStore.save({
        email: cleanEmail,
        nom: nom || cleanEmail.split('@')[0],
        telephone: telephone || '',
        role,
      });
    }

    if (realSupabase) {
      try {
        await realSupabase.from('profiles').upsert(existing);
      } catch (e) {
        console.warn('Erreur synchro Supabase profile:', e);
      }
    }

    logActivity({
      table: 'User',
      action: 'role_change',
      description: `Rôle '${role}' attribué à ${cleanEmail}`,
      user_email: cleanEmail,
    });

    return existing;
  },

  async revokeTeamRole(profileId: string): Promise<boolean> {
    const profile = profilesStore.getById(profileId);
    if (!profile) return false;
    profile.role = 'client';
    profilesStore.save(profile);

    if (realSupabase) {
      try {
        await realSupabase.from('profiles').update({ role: 'client' }).eq('id', profileId);
      } catch (e) {
        console.warn('Erreur révocation Supabase:', e);
      }
    }

    logActivity({
      table: 'User',
      action: 'role_change',
      description: `Révocation des droits staff de ${profile.email} (rétrogradé en client)`,
      user_email: profile.email,
    });

    return true;
  },
};
