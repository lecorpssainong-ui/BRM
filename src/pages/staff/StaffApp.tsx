import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCachedQuery } from '@/lib/offline';
import { useAppSettings } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import Logo from '@/components/brand/Logo';
import StaffGate from '@/components/staff/StaffGate';
import ClosedScreen from '@/components/client/ClosedScreen';
import StaffSidebar, { StaffSectionItem } from '@/components/staff/StaffSidebar';

// 9 Secretary Sections
import StaffInbox from '@/components/staff/StaffInbox';
import SecretaryPanel from '@/components/SecretaryPanel';
import PaymentValidation from '@/components/staff/PaymentValidation';
import ServicesManager from '@/components/staff/ServicesManager';
import ShopManager from '@/components/staff/ShopManager';
import InvoicesManager from '@/components/staff/InvoicesManager';
import AnamnesisManager from '@/components/staff/anamnesis/AnamnesisManager';
import AnamnesisArchiveLibrary from '@/components/staff/AnamnesisArchiveLibrary';
import StaffStats from '@/components/staff/StaffStats';
import AnnouncementsManager from '@/components/staff/AnnouncementsManager';

// 11 Moderator Sections
import StaffDashboard from '@/components/staff/StaffDashboard';
import HomeEditor from '@/components/staff/home/HomeEditor';
import ModerationCreditPanel from '@/components/staff/ModerationCreditPanel';
import InvoiceDesign from '@/components/staff/InvoiceDesign';
import ComposerSettings from '@/components/staff/ComposerSettings';
import AiStudio from '@/components/staff/ai/AiStudio';
import ModerationCockpit from '@/components/ModerationCockpit';
import TeamManager from '@/components/staff/TeamManager';
import ActivityLog from '@/components/staff/ActivityLog';
import StaffSettings from '@/components/staff/StaffSettings';

import {
  MessageSquare,
  Calendar,
  CreditCard,
  Sparkles,
  ShoppingBag,
  Receipt,
  ClipboardList,
  HeartPulse,
  BarChart3,
  LayoutDashboard,
  Home,
  Sliders,
  Palette,
  MessageCircle,
  Bot,
  Compass,
  FileText,
  Users,
  History,
  Settings,
  LayoutGrid,
  Rows,
  ArrowLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LogOut,
  Grid2X2,
  Grid3X3,
  Megaphone,
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { toast } from '@/components/ui/toaster';

const BASE_SECTIONS: StaffSectionItem[] = [
  { value: 'inbox', label: 'Communication', icon: MessageSquare, description: 'Échanges en temps réel avec les clients' },
  { value: 'appointments', label: 'Rendez-vous', icon: Calendar, description: 'Planning et confirmations de séances' },
  { value: 'payments', label: 'Paiement', icon: CreditCard, description: 'Vérification et validation Mobile Money' },
  { value: 'services', label: 'Soins & Vidéos', icon: Sparkles, description: 'Gestion du catalogue et capsules vidéo' },
  { value: 'shop', label: 'Boutique', icon: ShoppingBag, description: 'Articles, huiles de massage et commandes' },
  { value: 'announcements', label: "Statuts d'Accueil", icon: Megaphone, description: "Stories, statuts et alertes diffusés sur l'accueil client" },
  { value: 'invoices', label: 'Factures', icon: Receipt, description: 'Émission et exports PDF des factures' },
  { value: 'anamnesis', label: 'Anamnèses', icon: ClipboardList, description: 'Bilans de santé et antécédents clients' },
  { value: 'bilans', label: 'Bibliothèque client', icon: HeartPulse, description: 'Bibliothèque des bilans et protocoles' },
  { value: 'stats', label: 'Statistiques', icon: BarChart3, description: 'Chiffre d’affaires et ratios périodiques' },
];

const MOD_SECTIONS: StaffSectionItem[] = [
  { value: 'dashboard', label: 'Mise à jour', icon: LayoutDashboard, description: 'Tableau de bord et alertes opérationnelles' },
  { value: 'home', label: 'Accueil', icon: Home, description: 'Éditeur du Hero, Logo et en-tête client' },
  { value: 'announcements', label: "Statuts d'Accueil", icon: Megaphone, description: "Stories, statuts et alertes diffusés sur l'accueil client" },
  { value: 'credits', label: 'Modération & Crédit', icon: Sliders, description: 'Curseurs de puissance IA et validation/rejet' },
  { value: 'invoice-design', label: 'Design Facture', icon: Palette, description: 'Atelier graphique et filigranes des factures' },
  { value: 'messages', label: 'Messagerie', icon: MessageCircle, description: 'Habillage de la conversation et du composer' },
  { value: 'ai', label: 'Studio IA', icon: Bot, description: 'Cerveau du conseiller et résumé auto du catalogue' },
  { value: 'security', label: 'Navigateur et sécurité', icon: Compass, description: 'Géométrie du BottomNav et codes de sécurité' },
  { value: 'protocol', label: 'Bilan et protocole', icon: FileText, description: 'Protocoles de réflexologie et archives bilans' },
  { value: 'team', label: "Gestion d'équipe", icon: Users, description: 'Attribution des rôles staff par adresse Gmail' },
  { value: 'activity', label: 'Journal', icon: History, description: 'Audit chronologique des actions et purges' },
  { value: 'settings', label: 'Paramètres', icon: Settings, description: 'Coordonnées, comptes marchands et agencement' },
];

interface StaffAppProps {
  initialSection?: string;
}

export default function StaffApp({ initialSection = 'inbox' }: StaffAppProps) {
  const { user, isLoadingAuth, logout } = useAuth();
  const { data: settings } = useAppSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('tab') || searchParams.get('view');
  const [section, setSection] = useState<string>(initialSection);

  const isModeratorUser = user?.role === 'moderator';
  const isSecretaryUser = user?.role === 'secretary';
  const isStaff = isModeratorUser || isSecretaryUser;

  // Si l'utilisateur est modérateur, il a accès aux deux vues et peut basculer activement
  const [activeCockpitRole, setActiveCockpitRole] = useState<'moderator' | 'secretary'>(() => {
    if (requestedView === 'secretary') return 'secretary';
    if (isModeratorUser) return 'moderator';
    return 'secretary';
  });

  useEffect(() => {
    if (requestedView === 'secretary') {
      setActiveCockpitRole('secretary');
    } else if (requestedView === 'moderator' && isModeratorUser) {
      setActiveCockpitRole('moderator');
    }
  }, [requestedView, isModeratorUser]);

  const isModerator = activeCockpitRole === 'moderator' && isModeratorUser;
  const roleKey = isModerator ? 'moderator' : 'secretary';

  // Layout view preferences: 'tabs' (default) vs 'grid'
  const [viewMode, setViewMode] = useState<'tabs' | 'grid'>(() => {
    return (localStorage.getItem(`brm_cockpit_view_${roleKey}`) as any) || 'tabs';
  });
  const [gridCols, setGridCols] = useState<number>(() => {
    return Number(localStorage.getItem(`brm_cockpit_cols_${roleKey}`)) || 3;
  });
  const [orderedKeys, setOrderedKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`brm_tabs_order_${roleKey}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [showGridOverview, setShowGridOverview] = useState<boolean>(viewMode === 'grid');

  // Live Countdown state for staff cockpit
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to cockpit layout changes
  useEffect(() => {
    const handleLayoutChange = () => {
      const mode = (localStorage.getItem(`brm_cockpit_view_${roleKey}`) as any) || 'tabs';
      const cols = Number(localStorage.getItem(`brm_cockpit_cols_${roleKey}`)) || 3;
      try {
        const raw = localStorage.getItem(`brm_tabs_order_${roleKey}`);
        if (raw) setOrderedKeys(JSON.parse(raw));
      } catch {}
      setViewMode(mode);
      setGridCols(cols);
      if (mode === 'grid') setShowGridOverview(true);
    };

    window.addEventListener('brm-cockpit-layout-change', handleLayoutChange);
    return () => window.removeEventListener('brm-cockpit-layout-change', handleLayoutChange);
  }, [roleKey]);

  // Read data for badges
  const { data: messages = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-badge-messages'],
    enabled: Boolean(user),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          return data.map((m: any) => ({
            id: m.id,
            client_key: m.client_key,
            client_name: m.sender_name,
            sender: m.sender === 'client' ? 'client' : 'staff',
            text: m.content,
            created_date: m.created_at,
            read: m.read,
          }));
        }
      } catch (err) {
        console.warn('Fallback local base44 badge messages:', err);
      }
      return base44.entities.Message.list('-created_date', 500);
    },
    staleTime: 5000,
  });

  const { data: appointments = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-badge-appts'],
    enabled: Boolean(user),
    queryFn: async () => base44.entities.Appointment.list('-date', 500),
    staleTime: 5000,
  });

  const { data: orders = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-badge-orders'],
    enabled: Boolean(user),
    queryFn: async () => base44.entities.Order.list('-created_date', 500),
    staleTime: 5000,
  });

  const { data: invoices = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-badge-invoices'],
    enabled: Boolean(user),
    queryFn: async () => base44.entities.Invoice.list('-created_date', 500),
    staleTime: 5000,
  });

  const { data: clients = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-badge-clients'],
    enabled: Boolean(user),
    queryFn: async () => base44.entities.Client.list('-last_seen', 500),
    staleTime: 10000,
  });

  // Calculate badges
  const unreadMessagesCount = messages.filter((m: any) => m.sender === 'client' && !m.read).length;
  const pendingApptsCount = appointments.filter((a: any) => a.status === 'pending').length;
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;

  // Sync initialSection prop
  useEffect(() => {
    if (initialSection) setSection(initialSection);
  }, [initialSection]);

  // Check countdown expiration trigger
  useEffect(() => {
    if (
      settings?.is_countdown_active &&
      settings?.countdown_date &&
      !settings?.is_locked
    ) {
      const expTime = new Date(settings.countdown_date).getTime();
      if (now >= expTime) {
        // Auto-lock application
        if (isModerator) {
          supabase
            .from('app_settings')
            .update({
              is_locked: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'a0000000-0000-0000-0000-000000000001')
            .select()
            .single()
            .then(({ data, error }) => {
              console.log('Update app_settings:', { data, error });
            });

          if (settings?.id) {
            base44.entities.AppSettings.update(settings.id, {
              is_locked: true,
              app_active: false,
              app_opened: false,
            }).then(() => {
              toast({
                title: '🔒 Compte à rebours expiré',
                description: 'L\'application a été automatiquement verrouillée pour maintenance.',
                variant: 'destructive',
              });
            });
          }
        }
      }
    }
  }, [settings, now, isModerator]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cacao/20 border-t-cacao rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <StaffGate />;
  }

  if (!isStaff) {
    return <StaffGate denied />;
  }

  // App Closed / Locked guard (Moderator always bypasses)
  const isLocked =
    settings &&
    (settings.is_locked === true ||
      settings.app_active === false ||
      settings.app_opened === false);
  const isMasterUnlocked =
    typeof window !== 'undefined' && sessionStorage.getItem('brm_master_unlock') === 'true';

  if (isLocked && !isModerator && !isMasterUnlocked) {
    return <ClosedScreen message={settings?.lock_message || settings?.closed_message} />;
  }

  // Pool of available sections strictly dissociated by role
  const rawSectionsList = isModerator ? [...BASE_SECTIONS, ...MOD_SECTIONS] : BASE_SECTIONS;

  // Reorder sections if custom order is defined
  const sectionsList = useMemo(() => {
    if (!orderedKeys || orderedKeys.length === 0) return rawSectionsList;
    const sorted: StaffSectionItem[] = [];
    orderedKeys.forEach((key) => {
      const found = rawSectionsList.find((s) => s.value === key);
      if (found) sorted.push(found);
    });
    // Add any remaining
    rawSectionsList.forEach((s) => {
      if (!sorted.some((item) => item.value === s.value)) sorted.push(s);
    });
    return sorted;
  }, [rawSectionsList, orderedKeys]);

  // With badge counts
  const sectionsWithBadges = sectionsList.map((sec) => {
    if (sec.value === 'inbox') return { ...sec, badgeCount: unreadMessagesCount };
    if (sec.value === 'appointments') return { ...sec, badgeCount: pendingApptsCount };
    if (sec.value === 'payments') return { ...sec, badgeCount: pendingOrdersCount };
    return sec;
  });

  // Active section safety guard: if secretary requests mod section, fallback to inbox
  const activeSection = sectionsList.some((s) => s.value === section) ? section : 'inbox';
  const currentSectionItem = sectionsWithBadges.find((s) => s.value === activeSection);

  const toggleViewMode = () => {
    const nextMode = viewMode === 'grid' ? 'tabs' : 'grid';
    setViewMode(nextMode);
    setShowGridOverview(nextMode === 'grid');
    localStorage.setItem(`brm_cockpit_view_${roleKey}`, nextMode);
    window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
  };

  const getColClass = (cols: number) => {
    switch (cols) {
      case 2:
        return 'cockpit-grid-cols-2 grid grid-cols-1 sm:grid-cols-2';
      case 4:
        return 'cockpit-grid-cols-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
      case 5:
        return 'cockpit-grid-cols-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 3:
      default:
        return 'cockpit-grid-cols-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  // Countdown timer calculations
  const countdownTarget = settings?.is_countdown_active && settings?.countdown_date ? new Date(settings.countdown_date).getTime() : null;
  const countdownDiff = countdownTarget ? countdownTarget - now : null;
  const isCountdownRunning = countdownDiff !== null && countdownDiff > 0;

  const formattedCountdown = (() => {
    if (countdownDiff === null) return null;
    if (countdownDiff <= 0) return 'Expiré (Verrouillé)';
    const d = Math.floor(countdownDiff / (1000 * 60 * 60 * 24));
    const h = Math.floor((countdownDiff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((countdownDiff / 1000 / 60) % 60);
    const s = Math.floor((countdownDiff / 1000) % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}j`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  })();

  return (
    <div className="min-h-screen bg-sand text-cacao flex flex-col selection:bg-gold/30 font-body">
      {/* 
        1. UNIFIED LUXURY GLOBAL COCKPIT HEADER (Spans 100% width across the top) 
        No duplicate headers anywhere else in the application!
      */}
      <header className="sticky top-0 z-30 bg-[#1E130D]/95 text-sand border-b border-amber-900/50 shadow-xl backdrop-blur-xl px-4 sm:px-6 py-2.5 transition-all">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Branding & Role tag & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group shrink-0" title="Retourner à l'accueil client">
              <Logo size="sm" className="brightness-125 transition-transform group-hover:scale-105" />
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-amber-800/60">
              {isModeratorUser ? (
                <div className="flex items-center p-0.5 rounded-xl bg-black/50 border border-amber-400/40 text-[11px] font-bold shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCockpitRole('secretary');
                      setSearchParams({ view: 'secretary' });
                    }}
                    className={`py-1 px-2.5 rounded-lg transition cursor-pointer ${
                      activeCockpitRole === 'secretary'
                        ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                        : 'text-amber-200/70 hover:text-white'
                    }`}
                    title="Afficher les modules Secrétariat"
                  >
                    Secrétariat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCockpitRole('moderator');
                      setSearchParams({ view: 'moderator' });
                    }}
                    className={`py-1 px-2.5 rounded-lg transition cursor-pointer ${
                      activeCockpitRole === 'moderator'
                        ? 'bg-gold text-stone-950 font-black shadow-xs'
                        : 'text-amber-200/70 hover:text-white'
                    }`}
                    title="Afficher les modules Modération"
                  >
                    Modération
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-300">
                  {isModerator ? 'Cockpit Modérateur' : 'Cockpit Secrétaire'}
                </span>
              )}
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En direct
              </span>
            </div>

            {/* Breadcrumb section info when a module is active */}
            {currentSectionItem && (
              <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-amber-800/60 text-xs text-amber-200/80">
                <ChevronRight className="w-3.5 h-3.5 text-amber-400/50" />
                <span className="font-semibold text-amber-200">{currentSectionItem.label}</span>
              </div>
            )}
          </div>

          {/* Center: View Switcher (Tabs vs Grille) + Colonnes Selector + Live Countdown Banner */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* SEGMENTED SWITCHER : Tabs vs Grille */}
            <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-amber-500/30 backdrop-blur-md shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setViewMode('tabs');
                  setShowGridOverview(false);
                  localStorage.setItem(`brm_cockpit_view_${roleKey}`, 'tabs');
                  window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
                }}
                className={`py-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'tabs'
                    ? 'bg-gold text-stone-950 shadow-sm font-black'
                    : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
                }`}
                title="Affichage classique avec onglets latéraux"
              >
                <Rows className="w-3.5 h-3.5" />
                <span>Onglets</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('grid');
                  setShowGridOverview(true);
                  localStorage.setItem(`brm_cockpit_view_${roleKey}`, 'grid');
                  window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
                }}
                className={`py-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-gold text-stone-950 shadow-sm font-black'
                    : 'text-amber-200/70 hover:text-amber-100 hover:bg-white/5'
                }`}
                title="Affichage en grille des 20 modules"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grille ({sectionsWithBadges.length})</span>
              </button>
            </div>

            {/* Quick Columns Switcher in Header (when in Grid mode) */}
            {viewMode === 'grid' && (
              <div className="hidden md:flex items-center p-1 rounded-2xl bg-black/30 border border-amber-500/20 text-xs">
                <span className="px-2 text-[10px] uppercase font-bold text-amber-300/70">
                  Colonnes :
                </span>
                {[2, 3, 4, 5].map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => {
                      setGridCols(cols);
                      localStorage.setItem(`brm_cockpit_cols_${roleKey}`, String(cols));
                      window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
                    }}
                    className={`py-1 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      gridCols === cols
                        ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                        : 'text-amber-200/70 hover:text-white'
                    }`}
                    title={`${cols} colonnes par ligne (${cols === 2 ? '10 lignes' : cols === 3 ? '7 lignes' : cols === 4 ? '5 lignes' : '4 lignes'})`}
                  >
                    {cols}
                  </button>
                ))}
              </div>
            )}

            {/* Live Countdown Banner (Visible ONLY for staff) */}
            {isCountdownRunning && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs shadow-inner"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span className="font-semibold hidden lg:inline">
                  {settings?.countdown_message || 'Verrouillage :'}
                </span>
                <span className="font-mono font-black text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-lg text-[11px]">
                  {formattedCountdown}
                </span>
              </motion.div>
            )}
          </div>

          {/* Right Controls: Public Site Link, Staff Info, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-sand/90 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer border border-white/10"
              title="Voir le site public client"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Site public</span>
            </Link>

            <button
              type="button"
              onClick={() => logout('/')}
              className="py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer border border-rose-500/30"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* 
          MODE TABS (Défaut) : Sidebar latérale gauche (Desktop) + barre d'onglets (Mobile)
          MODE GRILLE : La barre de navigation des Tabs DISPARAÎT totalement !
        */}
        {viewMode === 'tabs' && (
          <StaffSidebar
            sections={sectionsWithBadges}
            currentSection={activeSection}
            onSelectSection={(val) => {
              setSection(val);
            }}
            user={user}
            onLogout={() => logout('/')}
            viewMode="tabs"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1720px] w-full mx-auto">
          {/* 
            MODE GRILLE :
            - Si showGridOverview === true : Affiche la Grille de grandes cartes rectangulaires (glassmorphism)
            - Si showGridOverview === false : Affiche la section sélectionnée en PLEIN ÉCRAN avec bouton retour ⬅️ bien visible
            - Transitions fluides avec Shared Element Layout (layoutId) de Framer Motion
          */}
          {viewMode === 'grid' ? (
            <LayoutGroup id="cockpit-shared-element-layout">
              <AnimatePresence initial={false}>
                {showGridOverview ? (
                  /* A) GRILLE DES 20 MODULES DU SANCTUAIRE (2, 3, 4 ou 5 colonnes garanties) */
                  <motion.div
                    key="grid-overview-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cacao/10 dark:border-white/10">
                      <div>
                        <span className="eyebrow block mb-0.5 text-gold font-bold">Cockpit Professionnel</span>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-cacao dark:text-sand">
                          Tableau des {sectionsWithBadges.length} Modules du Sanctuaire
                        </h2>
                        <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-0.5">
                          Cliquez sur une carte pour ouvrir son espace de gestion en plein écran avec transition morphique.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                        {/* Sélecteur de colonnes (2, 3, 4 ou 5) */}
                        <div className="flex items-center p-1 rounded-2xl bg-white/90 dark:bg-stone-800/90 border border-cacao/15 shadow-sm text-xs font-bold">
                          <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-cacao/60 dark:text-sand/60 hidden sm:inline">
                            Disposition :
                          </span>
                          {[2, 3, 4, 5].map((cols) => (
                            <button
                              key={cols}
                              type="button"
                              onClick={() => {
                                setGridCols(cols);
                                localStorage.setItem(`brm_cockpit_cols_${roleKey}`, String(cols));
                                window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
                              }}
                              className={`py-1.5 px-3 rounded-xl transition cursor-pointer text-xs font-bold ${
                                gridCols === cols
                                  ? 'bg-gold text-stone-950 font-black shadow-sm'
                                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
                              }`}
                              title={`Disposer en ${cols} colonnes par ligne (${cols === 2 ? '10 lignes' : cols === 3 ? '7 lignes' : cols === 4 ? '5 lignes' : '4 lignes'})`}
                            >
                              {cols} cols ({cols === 2 ? '10 lig.' : cols === 3 ? '7 lig.' : cols === 4 ? '5 lig.' : '4 lig.'})
                            </button>
                          ))}
                        </div>

                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gold/20 text-gold border border-gold/30">
                          {sectionsWithBadges.length} modules
                        </span>
                      </div>
                    </div>

                    {/* STRICT CSS GRID CONTAINER WITH EXACT DYNAMIC COLUMNS */}
                    <div
                      className="w-full gap-4 sm:gap-5 lg:gap-6"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                      }}
                    >
                      {sectionsWithBadges.map((sec) => {
                        const Icon = sec.icon;
                        const isCurrent = sec.value === activeSection;

                        return (
                          <motion.div
                            key={sec.value}
                            layoutId={`staff-module-card-${sec.value}`}
                            transition={{
                              layout: { type: 'spring', stiffness: 350, damping: 32 },
                              opacity: { duration: 0.2 },
                            }}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSection(sec.value);
                              setShowGridOverview(false);
                            }}
                            className={`rounded-3xl cursor-pointer transition-colors duration-300 relative overflow-hidden group shadow-lg border backdrop-blur-xl flex flex-col justify-between ${
                              gridCols === 5
                                ? 'p-4'
                                : gridCols === 4
                                ? 'p-4.5 sm:p-5'
                                : gridCols === 2
                                ? 'p-6 sm:p-8'
                                : 'p-5 sm:p-6'
                            } ${
                              isCurrent
                                ? 'border-gold bg-gradient-to-br from-amber-500/20 via-white/90 to-amber-500/10 dark:from-stone-900 dark:via-stone-900/95 dark:to-amber-950/40'
                                : 'border-cacao/15 dark:border-amber-400/20 bg-white/85 dark:bg-[#1E1612]/90 hover:border-gold hover:shadow-2xl'
                            }`}
                          >
                            {/* Shimmer light bar on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-amber-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                            <div>
                              <div className="flex items-start justify-between gap-3 mb-3.5">
                                <motion.div
                                  layoutId={`staff-module-icon-${sec.value}`}
                                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                                  className={`rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0 shadow-inner group-hover:bg-gold group-hover:text-stone-950 transition-all duration-300 ${
                                    gridCols === 5
                                      ? 'w-10 h-10'
                                      : gridCols === 2
                                      ? 'w-14 h-14'
                                      : 'w-12 h-12'
                                  }`}
                                >
                                  <Icon className={gridCols === 5 ? 'w-5 h-5' : gridCols === 2 ? 'w-7 h-7' : 'w-6 h-6'} />
                                </motion.div>

                                {sec.badgeCount !== undefined && sec.badgeCount > 0 && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-stone-950 shadow-md animate-pulse">
                                    {sec.badgeCount}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <motion.h3
                                  layoutId={`staff-module-title-${sec.value}`}
                                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                                  className={`font-display font-bold text-cacao dark:text-sand group-hover:text-gold transition-colors ${
                                    gridCols === 5
                                      ? 'text-sm sm:text-base'
                                      : gridCols === 2
                                      ? 'text-xl sm:text-2xl'
                                      : 'text-base sm:text-lg'
                                  }`}
                                >
                                  {sec.label}
                                </motion.h3>
                                <p
                                  className={`text-cacao/70 dark:text-sand/70 line-clamp-2 leading-relaxed ${
                                    gridCols === 5 ? 'text-[11px]' : gridCols === 2 ? 'text-xs sm:text-sm' : 'text-xs'
                                  }`}
                                >
                                  {sec.description || 'Module de gestion opérationnelle du centre.'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-cacao/10 dark:border-white/10 flex items-center justify-between text-xs text-gold font-bold">
                              <span>Ouvrir</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  /* B) CONTENU PLEIN ÉCRAN DE LA SECTION (Issu du clic sur une carte en Mode Grille avec Shared Element morphing) */
                  <motion.div
                    key={`fullscreen-wrapper-${activeSection}`}
                    layoutId={`staff-module-card-${activeSection}`}
                    transition={{
                      layout: { type: 'spring', stiffness: 350, damping: 32 },
                      opacity: { duration: 0.25 },
                    }}
                    className="space-y-6 rounded-3xl p-5 sm:p-8 bg-white/90 dark:bg-[#1E1612]/95 backdrop-blur-2xl border border-cacao/15 dark:border-amber-400/25 shadow-2xl relative overflow-hidden"
                  >
                    {/* Top Bar with Prominent Return Button & Module Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cacao/10 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowGridOverview(true)}
                        className="btn-gold py-2.5 px-5 rounded-2xl text-xs sm:text-sm font-bold inline-flex items-center gap-2.5 shadow-md hover:scale-102 transition cursor-pointer self-start sm:self-auto"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>⬅️ Retour au tableau de bord (Grille)</span>
                      </button>

                      {currentSectionItem && (
                        <div className="flex items-center gap-3">
                          <motion.div
                            layoutId={`staff-module-icon-${activeSection}`}
                            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                            className="w-10 h-10 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0 shadow-inner"
                          >
                            {(() => {
                              const Icon = currentSectionItem.icon;
                              return <Icon className="w-5 h-5" />;
                            })()}
                          </motion.div>
                          <div>
                            <motion.h3
                              layoutId={`staff-module-title-${activeSection}`}
                              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                              className="font-display text-lg sm:text-xl font-bold text-cacao dark:text-sand"
                            >
                              {currentSectionItem.label}
                            </motion.h3>
                            <p className="text-[11px] text-cacao/60 dark:text-sand/60 hidden sm:block">
                              {currentSectionItem.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section Content */}
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      {/* Secretary Sections */}
                      {activeSection === 'inbox' && <StaffInbox />}
                      {activeSection === 'appointments' && <SecretaryPanel />}
                      {activeSection === 'payments' && <PaymentValidation />}
                      {activeSection === 'services' && <ServicesManager />}
                      {activeSection === 'shop' && <ShopManager />}
                      {activeSection === 'announcements' && <AnnouncementsManager />}
                      {activeSection === 'invoices' && <InvoicesManager />}
                      {activeSection === 'anamnesis' && <AnamnesisManager />}
                      {activeSection === 'bilans' && <AnamnesisArchiveLibrary />}
                      {activeSection === 'stats' && (
                        <StaffStats
                          appointments={appointments}
                          orders={orders}
                          invoices={invoices}
                          clients={clients}
                        />
                      )}

                      {/* Moderator Sections */}
                      {activeSection === 'dashboard' && (
                        <StaffDashboard
                          clients={clients}
                          messages={messages}
                          appointments={appointments}
                          orders={orders}
                          onNavigate={(sec) => {
                            setSection(sec);
                            setShowGridOverview(false);
                          }}
                        />
                      )}
                      {activeSection === 'home' && <HomeEditor />}
                      {activeSection === 'credits' && <ModerationCreditPanel />}
                      {activeSection === 'invoice-design' && <InvoiceDesign />}
                      {activeSection === 'messages' && <ComposerSettings />}
                      {activeSection === 'ai' && <AiStudio />}
                      {activeSection === 'security' && <ModerationCockpit />}
                      {activeSection === 'protocol' && <AnamnesisArchiveLibrary />}
                      {activeSection === 'team' && <TeamManager />}
                      {activeSection === 'activity' && <ActivityLog />}
                      {activeSection === 'settings' && <StaffSettings />}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </LayoutGroup>
          ) : (
            /* 
              MODE TABS (Défaut) :
              Affichage classique avec fil d'Ariane et bascule possible vers la grille
            */
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-cacao/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cacao/60 dark:text-sand/60">
                    {isModerator ? 'Cockpit Modérateur' : 'Cockpit Secrétaire'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-cacao/40" />
                  <span className="text-sm font-bold text-cacao dark:text-sand">
                    {currentSectionItem?.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleViewMode}
                  className="btn-soft py-1.5 px-3 text-xs inline-flex items-center gap-1.5 font-semibold cursor-pointer shadow-xs"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-gold" />
                  <span>Passer en Vue Grille</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Secretary Sections */}
                  {activeSection === 'inbox' && <StaffInbox />}
                  {activeSection === 'appointments' && <SecretaryPanel />}
                  {activeSection === 'payments' && <PaymentValidation />}
                  {activeSection === 'services' && <ServicesManager />}
                  {activeSection === 'shop' && <ShopManager />}
                  {activeSection === 'announcements' && <AnnouncementsManager />}
                  {activeSection === 'invoices' && <InvoicesManager />}
                  {activeSection === 'anamnesis' && <AnamnesisManager />}
                  {activeSection === 'bilans' && <AnamnesisArchiveLibrary />}
                  {activeSection === 'stats' && (
                    <StaffStats
                      appointments={appointments}
                      orders={orders}
                      invoices={invoices}
                      clients={clients}
                    />
                  )}

                  {/* Moderator Sections */}
                  {activeSection === 'dashboard' && (
                    <StaffDashboard
                      clients={clients}
                      messages={messages}
                      appointments={appointments}
                      orders={orders}
                      onNavigate={(sec) => setSection(sec)}
                    />
                  )}
                  {activeSection === 'home' && <HomeEditor />}
                  {activeSection === 'credits' && <ModerationCreditPanel />}
                  {activeSection === 'invoice-design' && <InvoiceDesign />}
                  {activeSection === 'messages' && <ComposerSettings />}
                  {activeSection === 'ai' && <AiStudio />}
                  {activeSection === 'security' && <ModerationCockpit />}
                  {activeSection === 'protocol' && <AnamnesisArchiveLibrary />}
                  {activeSection === 'team' && <TeamManager />}
                  {activeSection === 'activity' && <ActivityLog />}
                  {activeSection === 'settings' && <StaffSettings />}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
