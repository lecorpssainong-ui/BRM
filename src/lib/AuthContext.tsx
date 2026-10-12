import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase, UserProfile, profilesStore } from './supabaseClient';
import { useAppSettings } from './queries';
import { saveProfile as syncClientProfile, clearClientSession } from './clientProfile';
import { queryClientInstance } from './query-client';
import { logActivity } from './activityLogger';
import { getAuthReturnTo } from './authReturnTo';

export const STAFF_ROLES = ['admin', 'practitioner', 'secretary', 'superadmin', 'moderator'];
export const isStaffRole = (role?: string) =>
  Boolean(role && STAFF_ROLES.includes(String(role).toLowerCase().trim()));

export interface User {
  id: string;
  email: string;
  nom: string;
  prenoms?: string;
  full_name: string;
  telephone?: string;
  phone?: string;
  role: 'client' | 'secretary' | 'moderator' | 'admin' | 'practitioner' | 'superadmin' | string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: any;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
  updateUserProfile: (data: {
    nom?: string;
    prenoms?: string;
    full_name?: string;
    telephone?: string;
  }) => Promise<User>;
  getTeamMembers: () => Promise<UserProfile[]>;
  getAllUsers: () => Promise<UserProfile[]>;
  assignTeamRole: (
    telephoneOrEmail: string,
    role: 'secretary' | 'moderator' | 'client',
    nom?: string,
    telephone?: string
  ) => Promise<UserProfile>;
  revokeTeamRole: (id: string) => Promise<boolean>;
  navigateToLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<any>(null);
  const { isLoading: isLoadingPublicSettings } = useAppSettings();

  // Helper pour charger et formater le profil depuis Supabase via auth.uid() (id)
  const loadProfileForUser = async (sessionUser: any): Promise<User | null> => {
    if (!sessionUser || !sessionUser.id) return null;

    const userEmail = (sessionUser.email || '').trim().toLowerCase();
    const cachedProfile = profilesStore.getById(sessionUser.id) || (userEmail ? profilesStore.getByEmail(userEmail) : null);

    try {
      let profileData: any = null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (profile) {
        profileData = profile;
      } else {
        try {
          const { data: userRow } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle();
          if (userRow) profileData = userRow;
        } catch {}

        if (!profileData && userEmail) {
          try {
            const { data: profByEmail } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', userEmail)
              .maybeSingle();
            if (profByEmail) profileData = profByEmail;
          } catch {}

          if (!profileData) {
            try {
              const { data: userByEmail } = await supabase
                .from('users')
                .select('*')
                .eq('email', userEmail)
                .maybeSingle();
              if (userByEmail) profileData = userByEmail;
            } catch {}
          }
        }
      }

      const effEmail = (sessionUser.email || profileData?.email || cachedProfile?.email || '').trim().toLowerCase();
      const userPhone = profileData?.telephone || profileData?.phone || cachedProfile?.telephone || sessionUser.user_metadata?.telephone || '';
      const rawRole = (profileData?.role || cachedProfile?.role || 'client').toLowerCase().trim();
      const finalRole = rawRole;

      const metaNom =
        profile?.nom ||
        cachedProfile?.nom ||
        sessionUser.user_metadata?.nom ||
        sessionUser.user_metadata?.family_name ||
        effEmail.split('@')[0] ||
        'Client';

      const metaPrenoms =
        profile?.prenoms ||
        cachedProfile?.prenoms ||
        sessionUser.user_metadata?.prenoms ||
        sessionUser.user_metadata?.given_name ||
        '';

      const fullName =
        profile?.full_name ||
        cachedProfile?.full_name ||
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        `${metaNom} ${metaPrenoms}`.trim() ||
        metaNom;

      const avatarUrl =
        profile?.avatar_url ||
        cachedProfile?.avatar_url ||
        sessionUser.user_metadata?.avatar_url ||
        sessionUser.user_metadata?.picture ||
        '';

      const loadedUser: User = {
        id: sessionUser.id,
        email: effEmail,
        nom: metaNom,
        prenoms: metaPrenoms,
        full_name: fullName,
        telephone: userPhone,
        phone: userPhone,
        role: finalRole,
        avatar_url: avatarUrl,
      };

      // Si le profil existe, mise en cache locale synchronisée
      if (profile) {
        try {
          profilesStore.save({
            id: sessionUser.id,
            email: effEmail,
            nom: metaNom,
            full_name: fullName,
            telephone: userPhone,
            role: finalRole,
            avatar_url: avatarUrl,
          });
        } catch {}
      } else {
        // Défense avant trigger si absent
        await supabase.from('profiles').upsert({
          id: sessionUser.id,
          email: effEmail,
          nom: metaNom,
          prenoms: metaPrenoms,
          full_name: fullName,
          telephone: userPhone || null,
          role: 'client',
          avatar_url: avatarUrl,
          language: 'fr',
          theme: 'cacao',
          liked_massages: [],
          liked_videos: [],
          updated_at: new Date().toISOString(),
        });
      }

      // Synchronise systématiquement le profil local clientProfile avec l'utilisateur authentifié
      try {
        await syncClientProfile({
          name: fullName,
          phone: userPhone,
        });
      } catch (err) {
        console.warn('[AuthContext] syncClientProfile local fallback:', err);
      }

      return loadedUser;
    } catch (err) {
      console.warn('[AuthContext] Exception lors du chargement du profil (fallback sessionUser actif):', err);
      const fallbackEmail = userEmail || cachedProfile?.email || '';
      const fallbackNom =
        cachedProfile?.nom ||
        sessionUser.user_metadata?.nom ||
        sessionUser.user_metadata?.family_name ||
        fallbackEmail.split('@')[0] ||
        'Client';
      const fallbackPrenoms =
        cachedProfile?.prenoms ||
        sessionUser.user_metadata?.prenoms ||
        sessionUser.user_metadata?.given_name ||
        '';
      const fallbackFullName =
        cachedProfile?.full_name ||
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        `${fallbackNom} ${fallbackPrenoms}`.trim() ||
        fallbackNom;
      const fallbackPhone =
        cachedProfile?.telephone ||
        sessionUser.user_metadata?.telephone ||
        '';
      const fallbackRole: 'client' | 'secretary' | 'moderator' =
        (cachedProfile?.role as any) || 'client';

      return {
        id: sessionUser.id,
        email: fallbackEmail,
        nom: fallbackNom,
        prenoms: fallbackPrenoms,
        full_name: fallbackFullName,
        telephone: fallbackPhone,
        phone: fallbackPhone,
        role: fallbackRole,
        avatar_url: cachedProfile?.avatar_url || sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '',
      };
    }
  };

  // Nettoyage URL après retour OAuth et restauration de la session Supabase
  useEffect(() => {
    let isMounted = true;

    // Nettoyage URL après retour OAuth
    const hasOAuthParams =
      window.location.hash.includes('access_token') ||
      window.location.search.includes('code=');
    if (hasOAuthParams) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Restauration session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Session restored:', session?.user?.email);
      if (session?.user) {
        const profileUser = await loadProfileForUser(session.user);
        if (isMounted) {
          setUser(profileUser);
          setIsLoading(false);
        }
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          const returnTo = getAuthReturnTo('/') || '/';
          window.location.replace(returnTo);
        }
      } else {
        if (isMounted) setUser(null);
        if (isMounted) setIsLoading(false);
      }
    }).catch((err) => {
      console.warn('[AuthContext] Session restore error:', err);
      if (isMounted) {
        setAuthError(err);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session?.user?.email);
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Upsert profil dans profiles
          await supabase.from('profiles').upsert(
            {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email,
              avatar_url: session.user.user_metadata?.avatar_url,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (e) {
          console.warn('[AuthContext] Upsert profile error on SIGNED_IN:', e);
        }

        const profileUser = await loadProfileForUser(session.user);
        if (isMounted) {
          setUser(profileUser);
          setIsLoading(false);
        }
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          const returnTo = getAuthReturnTo('/') || '/';
          window.location.replace(returnTo);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      } else if (session?.user) {
        const profileUser = await loadProfileForUser(session.user);
        if (isMounted) {
          setUser(profileUser);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Connexion Google officielle via Supabase OAuth
   */
  const loginWithGoogle = async (redirectTo?: string): Promise<void> => {
    const targetUrl = redirectTo || (window.location.origin + window.location.pathname);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  };

  /**
   * Déconnexion sécurisée (purge locale et session globale Supabase/Google)
   */
  const logout = async (redirectTo?: string) => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[AuthContext] Déconnexion locale:', e);
      }
    }
    setUser(null);
    clearClientSession(queryClientInstance);
    try {
      queryClientInstance.clear();
    } catch {}
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  };

  /**
   * Mise à jour du profil utilisateur
   */
  const updateUserProfile = async (data: {
    nom?: string;
    prenoms?: string;
    full_name?: string;
    telephone?: string;
  }): Promise<User> => {
    if (!user) throw new Error('Utilisateur non connecté.');

    const cleanNom = data.nom !== undefined ? data.nom.trim() : user.nom;
    const cleanPrenoms = data.prenoms !== undefined ? data.prenoms.trim() : (user.prenoms || '');
    const cleanFullName = data.full_name !== undefined ? data.full_name.trim() : `${cleanNom} ${cleanPrenoms}`.trim();
    const cleanPhone = data.telephone !== undefined ? data.telephone.trim() : (user.telephone || '');

    await supabase
      .from('profiles')
      .update({
        nom: cleanNom,
        prenoms: cleanPrenoms,
        full_name: cleanFullName,
        telephone: cleanPhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    const updatedUser: User = {
      ...user,
      nom: cleanNom,
      prenoms: cleanPrenoms,
      full_name: cleanFullName,
      telephone: cleanPhone || '',
      phone: cleanPhone || '',
    };

    setUser(updatedUser);
    try {
      await syncClientProfile({ name: cleanFullName, phone: cleanPhone });
    } catch {}

    return updatedUser;
  };

  /**
   * Liste des membres du personnel
   */
  const getTeamMembers = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['secretary', 'moderator'])
      .order('role', { ascending: false });

    if (error || !data) return [];
    return data as UserProfile[];
  };

  /**
   * Liste de tous les utilisateurs
   */
  const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as UserProfile[];
  };

  /**
   * Attribution de rôle staff
   */
  const assignTeamRole = async (
    telephoneOrEmail: string,
    role: 'secretary' | 'moderator' | 'client',
    nom?: string,
    telephone?: string
  ): Promise<UserProfile> => {
    const cleanInput = telephoneOrEmail.trim();

    let query = supabase.from('profiles').select('*');
    if (cleanInput.includes('@')) {
      query = query.eq('email', cleanInput.toLowerCase());
    } else {
      query = query.eq('telephone', cleanInput);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      logActivity({
        table: 'User',
        action: 'role_change',
        description: `Rôle '${role}' attribué à ${cleanInput}`,
        user_email: existing.email,
      });

      return updated as UserProfile;
    }

    throw new Error("Aucun utilisateur trouvé avec ces coordonnées. Il doit d'abord se connecter avec Google.");
  };

  /**
   * Révocation d'un rôle staff
   */
  const revokeTeamRole = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'client', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return true;
  };

  const navigateToLogin = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoadingAuth: isLoading,
        isLoadingPublicSettings,
        authError,
        loginWithGoogle,
        logout,
        updateUserProfile,
        getTeamMembers,
        getAllUsers,
        assignTeamRole,
        revokeTeamRole,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
