import { useState, useEffect } from 'react';
import {
  Compass,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  ShieldAlert,
  Power,
  KeyRound,
  Eye,
  Sparkles,
  Bot,
  Building2,
  Phone,
  Clock,
  MessageSquare,
  ShieldCheck,
  BrainCircuit,
  Zap,
  HeartPulse,
  FileText,
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Trash2,
} from 'lucide-react';
import { useAppSettings } from '@/lib/queries';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/toaster';
import { useQueryClient } from '@tanstack/react-query';
import AnamnesisArchiveLibrary from './staff/AnamnesisArchiveLibrary';

/**
 * Cockpit Modérateur : Ajustement Sur-Mesure du Navigateur (BottomNav), Sécurité & Studio IA
 */
export default function ModerationCockpit() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();
  const { user, getTeamMembers, assignTeamRole, revokeTeamRole } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'nav' | 'ai' | 'bilans' | 'team'>('nav');

  // Team Management states
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'secretary' | 'moderator'>('secretary');
  const [teamActionLoading, setTeamActionLoading] = useState(false);

  // BottomNav dimensional states
  const [navOffsetX, setNavOffsetX] = useState(0);
  const [navOffsetY, setNavOffsetY] = useState(16);
  const [navWidth, setNavWidth] = useState(92);
  const [navPaddingY, setNavPaddingY] = useState(12);
  const [navBorderRadius, setNavBorderRadius] = useState(24);

  // Power & Security codes
  const [appOpened, setAppOpened] = useState(true);
  const [masterAccessCode, setMasterAccessCode] = useState('Acces');
  const [clientUnblockCode, setClientUnblockCode] = useState('Accepter');

  // Studio IA states (Sub-sections a, b, c)
  // a) Coordonnées & Infos officielles du Centre
  const [centerName, setCenterName] = useState('Bénin Réflexologie Massage - ONG Le Corps Sain');
  const [centerCity, setCenterCity] = useState('Cotonou, Bénin');
  const [centerPhone, setCenterPhone] = useState('+229 97 00 00 00');
  const [centerWhatsapp, setCenterWhatsapp] = useState('+229 97 00 00 00');
  const [centerServices, setCenterServices] = useState(
    'Réflexologie plantaire, massage suédois, drainage lymphatique, soins palmaires & crâniens, rituels holistiques'
  );
  const [centerHours, setCenterHours] = useState(
    'Lundi au Samedi : 08h00 - 20h00, Dimanche sur rendez-vous'
  );

  // b) Directives système & Personnalité
  const [aiName, setAiName] = useState('Awa');
  const [aiTone, setAiTone] = useState('Professionnel et chaleureux');
  const [complexCaseBehavior, setComplexCaseBehavior] = useState(
    'Orienter avec précaution vers une consultation médicale ou un rendez-vous personnalisé en centre.'
  );
  const [fallbackBehavior, setFallbackBehavior] = useState(
    'Proposer des gestes d\'auto-massage doux et orienter vers les soins proches du catalogue officiel.'
  );

  // c) Gestion de la Mémoire de Conversation (2 à 15 messages)
  const [memoryLimit, setMemoryLimit] = useState(6);

  const [saving, setSaving] = useState(false);

  // Sync from loaded settings
  useEffect(() => {
    if (settings) {
      setNavOffsetX(Number(settings.nav_offset_x ?? 0));
      setNavOffsetY(Number(settings.nav_offset_y ?? settings.nav_bottom ?? 16));
      setNavWidth(
        typeof settings.nav_width === 'string'
          ? parseInt(settings.nav_width, 10) || 92
          : Number(settings.nav_width ?? 92)
      );
      setNavPaddingY(Number(settings.nav_padding_y ?? 12));
      setNavBorderRadius(Number(settings.nav_border_radius ?? 24));
      setAppOpened(settings.app_opened !== false && settings.app_active !== false);
      if (settings.master_access_code) setMasterAccessCode(settings.master_access_code);
      if (settings.client_unblock_code) setClientUnblockCode(settings.client_unblock_code);

      // Parse ai_system_config
      if (settings.ai_system_config) {
        try {
          const cfg =
            typeof settings.ai_system_config === 'string'
              ? JSON.parse(settings.ai_system_config)
              : settings.ai_system_config;

          if (cfg.center_info) {
            if (cfg.center_info.name) setCenterName(cfg.center_info.name);
            if (cfg.center_info.city) setCenterCity(cfg.center_info.city);
            if (cfg.center_info.phone) setCenterPhone(cfg.center_info.phone);
            if (cfg.center_info.whatsapp) setCenterWhatsapp(cfg.center_info.whatsapp);
            if (cfg.center_info.services) setCenterServices(cfg.center_info.services);
            if (cfg.center_info.hours) setCenterHours(cfg.center_info.hours);
          }

          if (cfg.persona) {
            if (cfg.persona.ai_name) setAiName(cfg.persona.ai_name);
            if (cfg.persona.tone) setAiTone(cfg.persona.tone);
            if (cfg.persona.complex_case_behavior)
              setComplexCaseBehavior(cfg.persona.complex_case_behavior);
            if (cfg.persona.fallback_behavior)
              setFallbackBehavior(cfg.persona.fallback_behavior);
          }

          if (cfg.memory_limit !== undefined) {
            setMemoryLimit(Math.max(2, Math.min(15, Number(cfg.memory_limit))));
          }
        } catch (e) {
          console.warn('Error parsing ai_system_config:', e);
        }
      }
    }
  }, [settings]);

  const handleResetDefaults = () => {
    setNavOffsetX(0);
    setNavOffsetY(16);
    setNavWidth(92);
    setNavPaddingY(12);
    setNavBorderRadius(24);
    toast({
      title: 'Valeurs par défaut rétablies',
      description: 'N\'oubliez pas de cliquer sur "Enregistrer les modifications" pour persister.',
    });
  };

  const handleResetAiDefaults = () => {
    setCenterName('Bénin Réflexologie Massage - ONG Le Corps Sain');
    setCenterCity('Cotonou, Bénin');
    setCenterPhone('+229 97 00 00 00');
    setCenterWhatsapp('+229 97 00 00 00');
    setCenterServices(
      'Réflexologie plantaire, massage suédois, drainage lymphatique, soins palmaires & crâniens, rituels holistiques'
    );
    setCenterHours('Lundi au Samedi : 08h00 - 20h00, Dimanche sur rendez-vous');
    setAiName('Awa');
    setAiTone('Professionnel et chaleureux');
    setComplexCaseBehavior(
      'Orienter avec précaution vers une consultation médicale ou un rendez-vous personnalisé en centre.'
    );
    setFallbackBehavior(
      'Proposer des gestes d\'auto-massage doux et orienter vers les soins proches du catalogue officiel.'
    );
    setMemoryLimit(6);
    toast({
      title: 'Paramètres Studio IA par défaut réinitialisés',
      description: 'Cliquez sur enregistrer pour valider dans la base de données.',
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);

    const aiConfigObj = {
      center_info: {
        name: centerName.trim(),
        city: centerCity.trim(),
        phone: centerPhone.trim(),
        whatsapp: centerWhatsapp.trim(),
        services: centerServices.trim(),
        hours: centerHours.trim(),
      },
      persona: {
        ai_name: aiName.trim(),
        tone: aiTone.trim(),
        complex_case_behavior: complexCaseBehavior.trim(),
        fallback_behavior: fallbackBehavior.trim(),
      },
      memory_limit: Number(memoryLimit),
    };

    const payload = {
      nav_offset_x: navOffsetX,
      nav_offset_y: navOffsetY,
      nav_width: `${navWidth}%`,
      nav_padding_y: navPaddingY,
      nav_border_radius: navBorderRadius,
      app_opened: appOpened,
      app_active: appOpened,
      master_access_code: masterAccessCode.trim() || 'Acces',
      client_unblock_code: clientUnblockCode.trim() || 'Accepter',
      ai_config: aiConfigObj,
      ai_system_config: aiConfigObj,
      // Compatibility fields for local AI Studio
      ai_name: aiName.trim(),
      ai_tone: aiTone.trim(),
    };

    try {
      // 1. MockStore Direct Local Persistence (Prioritaire & Ultra-rapide)
      const { mockStore } = await import('@/lib/mockStore');
      await mockStore.saveAppSettings(payload);

      // 2. Supabase Persistence (singleton id = 'a0000000-0000-0000-0000-000000000001')
      // Envoi uniquement des colonnes modifiées
      try {
        const supabasePayload: Record<string, any> = {
          is_locked: !appOpened,
          header_title: centerName.trim() || 'Bénin Réflexologie Massage',
          center_phone: centerPhone.trim() || '0191729117',
          ai_name: aiName.trim() || 'Rébecca la lionne',
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('app_settings')
          .update(supabasePayload)
          .eq('id', 'a0000000-0000-0000-0000-000000000001')
          .select()
          .single();

        console.log('Update app_settings:', { data, error });
      } catch (err) {
        console.warn('Supabase app_settings update warning:', err);
      }

      // 3. Base44 Fallback Persistence
      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, payload);
      } else {
        await base44.entities.AppSettings.create(payload);
      }

      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });

      toast({
        title: 'Réglages enregistrés avec succès !',
        description: 'La configuration Studio IA et les réglages de navigation sont synchronisés en direct.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Erreur d\'enregistrement',
        description: err?.message || 'Impossible de mettre à jour la base de données.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Chargement réactif de l'équipe
  useEffect(() => {
    if (activeTab === 'team') {
      setLoadingTeam(true);
      getTeamMembers()
        .then((list) => setTeamMembers(Array.isArray(list) ? list : []))
        .catch(() => setTeamMembers([]))
        .finally(() => setLoadingTeam(false));
    }
  }, [activeTab]);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || teamActionLoading) return;
    setTeamActionLoading(true);
    try {
      await assignTeamRole(newEmail.trim(), newRole, newName.trim());
      toast({
        title: 'Rôle accordé avec succès',
        description: `L'adresse ${newEmail.trim()} dispose maintenant du rôle ${
          newRole === 'moderator' ? 'Modérateur' : 'Secrétaire'
        }.`,
        variant: 'success',
      });
      setNewEmail('');
      setNewName('');
      const list = await getTeamMembers();
      setTeamMembers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast({
        title: 'Erreur d\'attribution',
        description: err?.message || 'Impossible d\'attribuer ce rôle.',
        variant: 'destructive',
      });
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleRevoke = async (member: any) => {
    if (member.id === user?.id) {
      toast({
        title: 'Action interdite',
        description: 'Vous ne pouvez pas révoquer votre propre compte actif.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await revokeTeamRole(member.id);
      toast({ title: 'Accès staff révoqué', variant: 'default' });
      const list = await getTeamMembers();
      setTeamMembers(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de révoquer l\'accès.',
        variant: 'destructive',
      });
    }
  };

  // RÈGLE D'OR MODÉRATEUR :
  // Les comptes avec le rôle 'moderator' ont accès
  const isModerator = user?.role === 'moderator';

  if (!isModerator) {
    return (
      <div className="card-soft p-8 sm:p-12 text-center max-w-xl mx-auto my-8 space-y-4 border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 font-body">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="eyebrow text-rose-700 block">Accès Restreint • Sécurité Modération</span>
        <h3 className="font-display text-2xl text-cacao dark:text-sand font-medium">
          Réservé Exclusivement aux Modérateurs
        </h3>
        <p className="text-xs sm:text-sm text-cacao/75 dark:text-sand/75 leading-relaxed">
          Le Cockpit de Contrôle Central et de Modération est strictement réservé aux comptes disposant du privilège modérateur.
        </p>
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 text-xs text-cacao/60 dark:text-sand/60">
          Votre compte actif : <span className="font-semibold text-cacao dark:text-sand">{user?.telephone || user?.email || 'Non connecté'}</span> ({user?.role || 'aucun rôle'})
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-1">Cockpit Modérateur • Rigueur Absolue</span>
          <h2 className="font-display text-3xl sm:text-4xl text-cacao dark:text-sand font-medium">
            Personnalisation & Contrôle Central
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-1">
            Pilotez en direct l'ergonomie géométrique du BottomNav mobile, la sécurité et le cerveau Studio IA du conseiller virtuel.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-cacao/10 shadow-sm self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('nav')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'nav'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao dark:hover:text-sand'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Navigateur & Sécurité</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao dark:hover:text-sand'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-gold" />
            <span>Studio IA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bilans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bilans'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao dark:hover:text-sand'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-gold" />
            <span>Bilans & Protocoles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'team'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao dark:hover:text-sand'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-gold" />
            <span>Gestion de l'Équipe</span>
          </button>
        </div>
      </div>

      {activeTab === 'bilans' && (
        <div className="pt-2">
          <AnamnesisArchiveLibrary />
        </div>
      )}

      {activeTab === 'nav' && (
        <>
          {/* SECTION 1 : APERÇU EN TEMPS RÉEL DU BOTTOMNAV */}
          <div className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-gold" />
                <div>
                  <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                    Ajustement sur-mesure du Navigateur (BottomNav)
                  </h3>
                  <p className="text-xs text-cacao/65 dark:text-sand/65">
                    Glissières de contrôle en temps réel pour configurer l'interface mobile au pixel près.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-cacao/60 hover:text-cacao dark:text-sand/60 dark:hover:text-sand inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser par défaut</span>
              </button>
            </div>

            {/* Aperçu interactif dynamique */}
            <div className="p-6 rounded-3xl bg-stone-100/90 dark:bg-stone-900/80 border border-cacao/10 dark:border-amber-400/20 flex flex-col items-center justify-center min-h-[160px] overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cacao/50 dark:text-sand/50 mb-4">
                Aperçu dynamique de la barre de navigation :
              </span>

              <div
                style={{
                  width: `${navWidth}%`,
                  maxWidth: '520px',
                  paddingTop: `${navPaddingY}px`,
                  paddingBottom: `${navPaddingY}px`,
                  borderRadius: `${navBorderRadius}px`,
                  transform: navOffsetX ? `translateX(${navOffsetX}px)` : undefined,
                  marginBottom: `${Math.min(24, navOffsetY / 2)}px`,
                  transition: 'all 0.15s ease-out',
                }}
                className="bg-[#2B1D16] text-white px-3 flex items-center justify-between gap-2 shadow-2xl border border-amber-900/40"
              >
                {['Accueil', 'Rendez-vous', 'Messages', 'Boutique', 'Découvrir'].map((label, idx) => {
                  const isSelected = idx === 1;
                  return (
                    <div
                      key={label}
                      style={{
                        borderRadius: `${Math.max(6, navBorderRadius - 4)}px`,
                      }}
                      className={`flex-1 py-1.5 px-2 text-center text-[10px] font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                          : 'text-white/80'
                      }`}
                    >
                      <span className="truncate block">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grille des 5 Sliders de contrôle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* 1. Position Horizontale */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cacao dark:text-sand">
                    1. Décalage Horizontal (X) :
                  </span>
                  <span className="font-mono text-gold font-bold">{navOffsetX} px</span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="80"
                  step="2"
                  value={navOffsetX}
                  onChange={(e) => setNavOffsetX(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
                />
                <span className="text-[10px] text-cacao/55 dark:text-sand/55 block">
                  Centrer ou décaler la barre vers la gauche / droite.
                </span>
              </div>

              {/* 2. Position Verticale */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cacao dark:text-sand">
                    2. Décalage Vertical (Marge du bas Y) :
                  </span>
                  <span className="font-mono text-gold font-bold">{navOffsetY} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="2"
                  value={navOffsetY}
                  onChange={(e) => setNavOffsetY(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
                />
                <span className="text-[10px] text-cacao/55 dark:text-sand/55 block">
                  Ajuster la distance d'élévation par rapport au bas de l'écran.
                </span>
              </div>

              {/* 3. Largeur */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cacao dark:text-sand">
                    3. Largeur de la barre :
                  </span>
                  <span className="font-mono text-gold font-bold">{navWidth} %</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  step="1"
                  value={navWidth}
                  onChange={(e) => setNavWidth(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
                />
                <span className="text-[10px] text-cacao/55 dark:text-sand/55 block">
                  Élargir ou rétrécir l'envergure horizontale de la navigation.
                </span>
              </div>

              {/* 4. Hauteur Interne (Padding Y) */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cacao dark:text-sand">
                    4. Hauteur interne (Rembourrage vertical) :
                  </span>
                  <span className="font-mono text-gold font-bold">{navPaddingY} px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="22"
                  step="1"
                  value={navPaddingY}
                  onChange={(e) => setNavPaddingY(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
                />
                <span className="text-[10px] text-cacao/55 dark:text-sand/55 block">
                  Ajuster l'épaisseur et la hauteur tactile des boutons.
                </span>
              </div>

              {/* 5. Arrondi des coins */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 md:col-span-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cacao dark:text-sand">
                    5. Arrondi des bordures (Rayon) :
                  </span>
                  <span className="font-mono text-gold font-bold">{navBorderRadius} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={navBorderRadius}
                  onChange={(e) => setNavBorderRadius(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
                />
                <span className="text-[10px] text-cacao/55 dark:text-sand/55 block">
                  Coins droits carrés (0 px), arrondis modernes (24 px) ou pilule intégrale (36+ px).
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2 : CODES DE SÉCURITÉ & INTERRUPTEUR GÉNÉRAL */}
          <div className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10 shadow-md">
            <div className="flex items-center gap-2 pb-3 border-b border-cacao/10">
              <KeyRound className="w-5 h-5 text-gold" />
              <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                Interrupteur Général & Codes Confidentiels
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10">
                <label className="text-xs font-bold text-cacao dark:text-sand block">
                  Code Maître d'Urgence (Fermeture)
                </label>
                <input
                  type="text"
                  value={masterAccessCode}
                  onChange={(e) => setMasterAccessCode(e.target.value)}
                  className="field font-mono font-bold text-sm tracking-wider"
                  placeholder="Acces"
                />
                <span className="text-[10px] text-cacao/60 dark:text-sand/60 block">
                  Permet au staff de rouvrir une session lorsque le centre est fermé.
                </span>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10">
                <label className="text-xs font-bold text-cacao dark:text-sand block">
                  Code de Déblocage Individuel Client
                </label>
                <input
                  type="text"
                  value={clientUnblockCode}
                  onChange={(e) => setClientUnblockCode(e.target.value)}
                  className="field font-mono font-bold text-sm tracking-wider"
                  placeholder="Accepter"
                />
                <span className="text-[10px] text-cacao/60 dark:text-sand/60 block">
                  Code confidentiel communiqué au client pour lever sa suspension.
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2 : STUDIO IA (SOUS-SECTIONS a, b, c) */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* HEADER DU STUDIO IA */}
          <div className="card-soft p-6 sm:p-8 space-y-4 border border-cacao/10 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                    Studio IA — Cerveau & Directives Thérapeutiques
                  </h3>
                  <p className="text-xs text-cacao/65 dark:text-sand/65">
                    Injecté en direct dans le prompt système du modèle Gemini Flash (`ai_system_config`).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetAiDefaults}
                className="text-xs text-cacao/60 hover:text-cacao dark:text-sand/60 dark:hover:text-sand inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Valeurs recommandées</span>
              </button>
            </div>

            {/* SOUS-SECTION A : COORDONNÉES & INFOS OFFICIELLES DU CENTRE */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                <Building2 className="w-4 h-4 text-gold" />
                <span>a) Coordonnées & Informations Officielles du Centre</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Nom Officiel du Centre
                  </label>
                  <input
                    type="text"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    className="field text-xs py-2.5"
                    placeholder="Bénin Réflexologie Massage - ONG Le Corps Sain"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Ville & Pays
                  </label>
                  <input
                    type="text"
                    value={centerCity}
                    onChange={(e) => setCenterCity(e.target.value)}
                    className="field text-xs py-2.5"
                    placeholder="Cotonou, Bénin"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Numéro de Téléphone Principal
                  </label>
                  <input
                    type="text"
                    value={centerPhone}
                    onChange={(e) => setCenterPhone(e.target.value)}
                    className="field text-xs py-2.5 font-mono"
                    placeholder="+229 97 00 00 00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Ligne WhatsApp du Centre
                  </label>
                  <input
                    type="text"
                    value={centerWhatsapp}
                    onChange={(e) => setCenterWhatsapp(e.target.value)}
                    className="field text-xs py-2.5 font-mono"
                    placeholder="+229 97 00 00 00"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Horaires d'Ouverture Officiels
                  </label>
                  <input
                    type="text"
                    value={centerHours}
                    onChange={(e) => setCenterHours(e.target.value)}
                    className="field text-xs py-2.5"
                    placeholder="Lundi au Samedi : 08h00 - 20h00, Dimanche sur rendez-vous"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Services & Spécialités Clés du Centre
                  </label>
                  <textarea
                    rows={2}
                    value={centerServices}
                    onChange={(e) => setCenterServices(e.target.value)}
                    className="field text-xs py-2 resize-none"
                    placeholder="Réflexologie plantaire, massage suédois, drainage lymphatique..."
                  />
                </div>
              </div>
            </div>

            {/* SOUS-SECTION B : DIRECTIVES SYSTÈME & PERSONNALITÉ */}
            <div className="space-y-4 pt-4 border-t border-cacao/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>b) Directives Système, Tempérament & Déontologie</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Nom du Conseiller Virtuel
                  </label>
                  <input
                    type="text"
                    value={aiName}
                    onChange={(e) => setAiName(e.target.value)}
                    className="field text-xs py-2.5"
                    placeholder="Awa"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Ton de Communication & Empathie
                  </label>
                  <input
                    type="text"
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="field text-xs py-2.5"
                    placeholder="Professionnel et chaleureux"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Instructions en cas de question complexe ou d'urgence médicale
                  </label>
                  <textarea
                    rows={2}
                    value={complexCaseBehavior}
                    onChange={(e) => setComplexCaseBehavior(e.target.value)}
                    className="field text-xs py-2 resize-none"
                    placeholder="Orienter avec précaution vers une consultation médicale ou un rendez-vous personnalisé en centre."
                  />
                  <span className="text-[10px] text-cacao/55 dark:text-sand/55 block">
                    Garantit la sécurité et la déontologie face aux pathologies graves.
                  </span>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-cacao dark:text-sand block">
                    Comportement de repli si le soin recherché n'est pas au catalogue
                  </label>
                  <textarea
                    rows={2}
                    value={fallbackBehavior}
                    onChange={(e) => setFallbackBehavior(e.target.value)}
                    className="field text-xs py-2 resize-none"
                    placeholder="Proposer des gestes d'auto-massage doux et orienter vers les soins proches du catalogue officiel."
                  />
                </div>
              </div>
            </div>

            {/* SOUS-SECTION C : GESTION DE LA MÉMOIRE DE CONVERSATION */}
            <div className="space-y-4 pt-4 border-t border-cacao/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                <Zap className="w-4 h-4 text-gold" />
                <span>c) Gestion de la Mémoire de Conversation (Optimisation des Tokens)</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 dark:bg-stone-800/70 border border-cacao/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cacao dark:text-sand">
                    Fenêtre de mémoire contextuelle :
                  </span>
                  <span className="font-mono text-sm font-bold text-gold px-2.5 py-0.5 rounded-full bg-gold/15">
                    {memoryLimit} messages récents
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 dark:bg-stone-700 rounded-lg"
                />

                <div className="flex justify-between text-[10px] font-bold text-cacao/50 dark:text-sand/50">
                  <span>2 messages (Éco ultra-rapide)</span>
                  <span>6 messages (Équilibré recommandé)</span>
                  <span>15 messages (Mémoire longue)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-cacao/80 dark:text-sand/80 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                  <span>
                    La mémoire est limitée aux <strong>{memoryLimit}</strong> derniers échanges pour préserver les quotas de l'API Gemini et réduire la latence de réponse.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4 : GESTION DE L'ÉQUIPE (MODÉRATEUR RACINE UNIQUEMENT) */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10 dark:border-white/10">
            <div>
              <span className="eyebrow block mb-1">Gouvernance & Sécurité Supabase</span>
              <h3 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
                Gestion des Rôles de l'Équipe
              </h3>
              <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-1 leading-relaxed">
                En tant que Modérateur Racine officiel, vous pouvez accorder le rôle de <strong>Secrétaire</strong> ou de <strong>Modérateur</strong> à des collaborateurs par leur adresse email. Les accès sont validés et persistés dans la table Supabase <code>profiles</code>.
              </p>
            </div>

            {/* Légende explicative des privilèges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <span>Modérateur</span>
                </div>
                <p className="text-[11px] text-cacao/70 dark:text-sand/70">
                  Accès cockpit modérateur, studio IA, journal d'activité et configuration.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Secrétaire</span>
                </div>
                <p className="text-[11px] text-cacao/70 dark:text-sand/70">
                  Gestion quotidienne des RDV, validation des paiements, factures et catalogue.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-cacao/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                  <Users className="w-4 h-4 text-stone-500" />
                  <span>Client (Défaut)</span>
                </div>
                <p className="text-[11px] text-cacao/70 dark:text-sand/70">
                  Réservations, boutique Mobile Money, vidéos, anamnèse et chat bien-être.
                </p>
              </div>
            </div>

            {/* Formulaire d'attribution de rôle */}
            <form
              onSubmit={handleAssignRole}
              className="p-5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-gold/30 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gold" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                  Accorder un rôle staff à une adresse email
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="text-[11px] font-semibold text-cacao/70 dark:text-sand/70 block mb-1">
                    Adresse email du collaborateur *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="collaborateur@domaine.com"
                    className="field text-xs sm:text-sm py-2"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[11px] font-semibold text-cacao/70 dark:text-sand/70 block mb-1">
                    Nom complet (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Sophie Secrétaire"
                    className="field text-xs sm:text-sm py-2"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-semibold text-cacao/70 dark:text-sand/70 block mb-1">
                    Rôle à attribuer *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="field text-xs sm:text-sm py-2 bg-white dark:bg-stone-800 cursor-pointer"
                  >
                    <option value="secretary">Secrétaire</option>
                    <option value="moderator">Modérateur</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={teamActionLoading || !newEmail.trim()}
                  className="btn-gold py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {teamActionLoading ? (
                    <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Accorder le rôle staff</span>
                </button>
              </div>
            </form>

            {/* Liste des membres de l'équipe */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" />
                  <span>Membres actuels de l'équipe ({teamMembers.length})</span>
                </h4>
              </div>

              {loadingTeam ? (
                <div className="p-8 text-center text-xs text-cacao/60 animate-pulse">
                  Chargement des membres de l'équipe...
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="card-soft p-6 text-center text-xs text-cacao/60">
                  Aucun membre d'équipe enregistré.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {teamMembers.map((member) => {
                    const isRoot = member.role === 'moderator';

                    return (
                      <div
                        key={member.id || member.email}
                        className="card-soft p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-cacao/10 dark:border-white/10 bg-white/60 dark:bg-stone-900/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isRoot
                              ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                              : member.role === 'moderator'
                              ? 'bg-amber-500/20 text-gold'
                              : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {(member.full_name || member.email || 'U')[0].toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-semibold text-sm text-cacao dark:text-sand truncate">
                                {member.full_name || member.email?.split('@')[0]}
                              </h5>

                              {isRoot ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gold text-stone-950 shadow-xs flex items-center gap-1">
                                  <Shield className="w-3 h-3 fill-current" />
                                  Modérateur Racine (Permanent)
                                </span>
                              ) : member.role === 'moderator' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200">
                                  Modérateur
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                                  Secrétaire
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-cacao/65 dark:text-sand/65 truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        {!isRoot && (
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <select
                              value={member.role}
                              onChange={async (e) => {
                                const newR = e.target.value as 'secretary' | 'moderator';
                                await assignTeamRole(member.email, newR, member.full_name);
                                toast({
                                  title: 'Rôle mis à jour',
                                  description: `${member.email} est désormais ${newR === 'moderator' ? 'Modérateur' : 'Secrétaire'}.`,
                                  variant: 'success',
                                });
                                const list = await getTeamMembers();
                                setTeamMembers(Array.isArray(list) ? list : []);
                              }}
                              className="field text-xs py-1.5 px-2.5 bg-white dark:bg-stone-800 cursor-pointer"
                            >
                              <option value="secretary">Secrétaire</option>
                              <option value="moderator">Modérateur</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRevoke(member)}
                              className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Révoquer les accès staff"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bouton de sauvegarde global */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={saving}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleSaveAll();
          }}
          className="btn-gold py-3.5 px-8 text-sm font-bold inline-flex items-center gap-2.5 shadow-2xl active:scale-95 transition cursor-pointer"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Enregistrer les réglages & Studio IA dans la BDD</span>
        </button>
      </div>
    </div>
  );
}
