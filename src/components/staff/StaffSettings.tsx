import { useState, useEffect, FormEvent } from 'react';
import { useAppSettings } from '@/lib/queries';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/toaster';
import { THEMES } from '@/components/ThemeApplier';
import { logActivity } from '@/lib/activityLogger';
import {
  Save,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  Gift,
  LayoutGrid,
  Columns,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Palette,
  Lock,
  Unlock,
  Sparkles,
  Sliders,
  Power,
  ShieldAlert,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const DEFAULT_SECTIONS_DEF = [
  { value: 'inbox', label: 'Communication' },
  { value: 'appointments', label: 'Rendez-vous' },
  { value: 'payments', label: 'Paiement' },
  { value: 'services', label: 'Soins & Vidéos' },
  { value: 'shop', label: 'Boutique' },
  { value: 'invoices', label: 'Factures' },
  { value: 'anamnesis', label: 'Anamnèses' },
  { value: 'bilans', label: 'Bibliothèque client' },
  { value: 'stats', label: 'Statistiques' },
  // Modérateur :
  { value: 'dashboard', label: 'Mise à jour', modOnly: true },
  { value: 'home', label: 'Accueil', modOnly: true },
  { value: 'credits', label: 'Modération & Crédit', modOnly: true },
  { value: 'invoice-design', label: 'Design Facture', modOnly: true },
  { value: 'messages', label: 'Messagerie', modOnly: true },
  { value: 'ai', label: 'Studio IA', modOnly: true },
  { value: 'security', label: 'Navigateur et sécurité', modOnly: true },
  { value: 'protocol', label: 'Bilan et protocole', modOnly: true },
  { value: 'team', label: "Gestion d'équipe", modOnly: true },
  { value: 'activity', label: 'Journal', modOnly: true },
  { value: 'settings', label: 'Paramètres', modOnly: true },
];

export default function StaffSettings() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const isModerator = user?.role === 'moderator';
  const roleKey = isModerator ? 'moderator' : 'secretary';

  const availableSections = DEFAULT_SECTIONS_DEF.filter(
    (s) => isModerator || !s.modOnly
  );

  const [cockpitGridCols, setCockpitGridCols] = useState<number>(() => {
    return Number(localStorage.getItem(`brm_cockpit_cols_${roleKey}`)) || 3;
  });

  const [orderedTabs, setOrderedTabs] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`brm_tabs_order_${roleKey}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return availableSections.map((s) => s.value);
  });

  const [forceGlobalTheme, setForceGlobalTheme] = useState(false);
  const [selectedGlobalTheme, setSelectedGlobalTheme] = useState('cacao');

  // App Lock & Kill Switch states
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('Le centre Bénin Réflexologie Massage est momentanément fermé ou en maintenance.');
  const [lockPassword, setLockPassword] = useState('Acces');
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownMessage, setCountdownMessage] = useState('Fermeture programmée du centre pour maintenance.');
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);

  const [form, setForm] = useState<any>({
    center_name: 'Bénin Réflexologie Massage',
    center_city: 'Cotonou',
    center_landmark: '',
    address: '',
    center_map_url: '',
    center_phone: '',
    whatsapp: '',
    center_email: '',
    opening_hours: '',
    welcome_message: '',
    logo_url: '',
    momo_number: '',
    momo_name: '',
    moov_number: '',
    moov_name: '',
    moov_ussd: '',
    celtiis_number: '',
    celtiis_name: '',
    celtiis_ussd: '',
    bank_name: '',
    bank_account_name: '',
    bank_iban: '',
    bank_swift: '',
    loyalty_percent: 15,
    loyalty_threshold: 11,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForceGlobalTheme(settings.force_global_theme === true);
      setSelectedGlobalTheme(settings.theme || 'cacao');

      // Lock settings
      setIsLocked(settings.is_locked === true || settings.app_active === false || settings.app_opened === false);
      setLockMessage(settings.lock_message || settings.closed_message || 'Le centre Bénin Réflexologie Massage est momentanément fermé ou en maintenance.');
      setLockPassword(settings.lock_password || settings.master_access_code || 'Acces');
      setCountdownDate(settings.countdown_date ? new Date(settings.countdown_date).toISOString().slice(0, 16) : '');
      setCountdownMessage(settings.countdown_message || 'Fermeture programmée du centre pour maintenance.');
      setIsCountdownActive(settings.is_countdown_active === true);

      setForm({
        center_name: settings.center_name || 'Bénin Réflexologie Massage',
        center_city: settings.center_city || 'Cotonou',
        center_landmark: settings.center_landmark || '',
        address: settings.address || '',
        center_map_url: settings.center_map_url || '',
        center_phone: settings.center_phone || '',
        whatsapp: settings.whatsapp || '',
        center_email: settings.center_email || '',
        opening_hours: settings.opening_hours || '',
        welcome_message: settings.welcome_message || '',
        logo_url: settings.logo_url || '',
        momo_number: settings.momo_number || '',
        momo_name: settings.momo_name || '',
        moov_number: settings.moov_number || '',
        moov_name: settings.moov_name || '',
        moov_ussd: settings.moov_ussd || '',
        celtiis_number: settings.celtiis_number || '',
        celtiis_name: settings.celtiis_name || '',
        celtiis_ussd: settings.celtiis_ussd || '',
        bank_name: settings.bank_name || '',
        bank_account_name: settings.bank_account_name || '',
        bank_iban: settings.bank_iban || '',
        bank_swift: settings.bank_swift || '',
        loyalty_percent: settings.loyalty_percent ?? 15,
        loyalty_threshold: settings.loyalty_threshold ?? 11,
      });
    }
  }, [settings]);

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newArr = [...orderedTabs];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setOrderedTabs(newArr);
    localStorage.setItem(`brm_tabs_order_${roleKey}`, JSON.stringify(newArr));
    window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
  };

  const resetTabsOrder = () => {
    const defaultOrder = availableSections.map((s) => s.value);
    setOrderedTabs(defaultOrder);
    localStorage.setItem(`brm_tabs_order_${roleKey}`, JSON.stringify(defaultOrder));
    window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
    toast({ title: 'Ordre initial des onglets restauré', variant: 'default' });
  };

  // Immediate Lock / Kill Switch Toggle
  const handleImmediateLockToggle = async () => {
    const nextLocked = !isLocked;
    setTogglingLock(true);
    try {
      // 1. Supabase app_settings (singleton id = 'a0000000-0000-0000-0000-000000000001')
      const { data, error } = await supabase
        .from('app_settings')
        .update({
          is_locked: nextLocked,
          lock_message: lockMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'a0000000-0000-0000-0000-000000000001')
        .select()
        .single();

      console.log('Update app_settings:', { data, error });

      const payload: Partial<any> = {
        is_locked: nextLocked,
        app_active: !nextLocked,
        app_opened: !nextLocked,
        lock_message: lockMessage,
        closed_message: lockMessage,
        lock_password: lockPassword,
        master_access_code: lockPassword,
      };

      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, payload);
      } else {
        await base44.entities.AppSettings.create(payload);
      }

      setIsLocked(nextLocked);
      logActivity({
        table: 'AppSettings',
        action: 'update',
        description: nextLocked
          ? 'KILL SWITCH ACTIVÉ : Verrouillage central immédiat de l\'application'
          : 'DÉVERROUILLAGE CENTRAL : Réouverture publique de l\'application',
      });

      toast({
        title: nextLocked ? '🚨 Application VERROUILLÉE' : '✅ Application DÉVERROUILLÉE',
        description: nextLocked
          ? 'L\'accès public est désormais bloqué par l\'écran de sécurité.'
          : 'L\'accès public et les réservations sont réactivés.',
        variant: nextLocked ? 'destructive' : 'success',
      });

      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'AppSettings' } }));
    } catch (err) {
      toast({ title: 'Erreur lors du basculement du verrouillage', variant: 'destructive' });
    } finally {
      setTogglingLock(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save local preferences
      localStorage.setItem(`brm_cockpit_cols_${roleKey}`, String(cockpitGridCols));
      localStorage.setItem(`brm_tabs_order_${roleKey}`, JSON.stringify(orderedTabs));
      window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));

      // 1. Supabase app_settings (singleton id = 'a0000000-0000-0000-0000-000000000001')
      // Envoi uniquement des colonnes officielles modifiées
      const supabasePayload: Record<string, any> = {
        is_locked: isLocked,
        lock_message: lockMessage,
        header_title: form.center_name || 'Bénin Réflexologie Massage',
        center_phone: form.center_phone || '0191729117',
        center_momo_number: form.momo_number || form.center_momo_number || '0191729117',
        center_address: form.address || form.center_address || 'Rue 340, Haie Vive, Cotonou, Bénin',
        updated_at: new Date().toISOString(),
      };
      if (form.moov_number || form.celtiis_number) {
        supabasePayload.center_momo_number_2 = form.moov_number || form.celtiis_number;
      }
      if (form.logo_url) {
        supabasePayload.logo_url = form.logo_url;
      }

      const { data, error } = await supabase
        .from('app_settings')
        .update(supabasePayload)
        .eq('id', 'a0000000-0000-0000-0000-000000000001')
        .select()
        .single();

      console.log('Update app_settings:', { data, error });

      // 2. Base44 AppSettings update
      const payload = {
        ...form,
        force_global_theme: forceGlobalTheme,
        theme: selectedGlobalTheme,
        is_locked: isLocked,
        app_active: !isLocked,
        app_opened: !isLocked,
        lock_message: lockMessage,
        closed_message: lockMessage,
        lock_password: lockPassword,
        master_access_code: lockPassword,
        countdown_date: countdownDate ? new Date(countdownDate).toISOString() : null,
        countdown_message: countdownMessage,
        is_countdown_active: isCountdownActive,
      };

      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, payload);
      } else {
        await base44.entities.AppSettings.create(payload);
      }

      logActivity({
        table: 'AppSettings',
        action: 'update',
        description: 'Mise à jour des paramètres du centre et du système de sécurité / verrouillage',
      });

      toast({ title: 'Paramètres et sécurité enregistrés !', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
      window.dispatchEvent(new Event('brm-theme-change'));
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'AppSettings' } }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-cacao/10">
        <div>
          <span className="eyebrow block mb-0.5">Identité du centre</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Paramètres & Coordonnées
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 mt-0.5">
            Ces informations officielles alimentent la carte d'accueil, le conseiller IA, les factures et le paiement Mobile Money.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
        </button>
      </div>

      {/* 1. Identity & Presentation */}
      <div className="card-soft p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold" />
          <h3 className="font-display text-xl text-cacao font-medium">
            Identité du Sanctuaire
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Nom officiel du centre
            </label>
            <input
              type="text"
              required
              value={form.center_name || ''}
              onChange={(e) => setForm({ ...form, center_name: e.target.value })}
              className="field font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              URL du logo
            </label>
            <input
              type="text"
              value={form.logo_url || ''}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://..."
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
            Message de bienvenue général
          </label>
          <textarea
            rows={2}
            value={form.welcome_message || ''}
            onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
            placeholder="Bienvenue au centre de réflexologie..."
            className="field text-xs sm:text-sm resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* 2. Localization */}
      <div className="card-soft p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gold" />
          <h3 className="font-display text-xl text-cacao font-medium">
            Adresse & Localisation
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Ville
            </label>
            <input
              type="text"
              value={form.center_city || ''}
              onChange={(e) => setForm({ ...form, center_city: e.target.value })}
              className="field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Quartier / Repère d'accès
            </label>
            <input
              type="text"
              value={form.center_landmark || ''}
              onChange={(e) => setForm({ ...form, center_landmark: e.target.value })}
              placeholder="Ex: Haie Vive, près de l'aéroport"
              className="field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Lien Google Maps
            </label>
            <input
              type="text"
              value={form.center_map_url || ''}
              onChange={(e) => setForm({ ...form, center_map_url: e.target.value })}
              placeholder="https://maps.google.com/..."
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
            Adresse complète
          </label>
          <input
            type="text"
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ex: Rue 340, Haie Vive, Cotonou, Bénin"
            className="field"
          />
        </div>
      </div>

      {/* 3. Contact & Hours */}
      <div className="card-soft p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-gold" />
          <h3 className="font-display text-xl text-cacao font-medium">
            Contact & Horaires
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Numéro de téléphone
            </label>
            <input
              type="text"
              value={form.center_phone || ''}
              onChange={(e) => setForm({ ...form, center_phone: e.target.value })}
              placeholder="+229 97 00 00 00"
              className="field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Numéro WhatsApp
            </label>
            <input
              type="text"
              value={form.whatsapp || ''}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="+229 97 00 00 00"
              className="field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Adresse email
            </label>
            <input
              type="email"
              value={form.center_email || ''}
              onChange={(e) => setForm({ ...form, center_email: e.target.value })}
              placeholder="contact@benin-reflexologie.bj"
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
            Horaires d'ouverture
          </label>
          <input
            type="text"
            value={form.opening_hours || ''}
            onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
            placeholder="Du lundi au samedi : 08h00 - 20h00"
            className="field"
          />
        </div>
      </div>

      {/* 4. Accounts & Merchant Networks (MTN, Moov, Celtiis, Bank) */}
      <div className="card-soft p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-cacao/10">
          <CreditCard className="w-5 h-5 text-gold" />
          <div>
            <h3 className="font-display text-xl text-cacao font-medium">
              Comptes Marchands & Modes de Règlement
            </h3>
            <p className="text-xs text-cacao/65">
              Configurez vos numéros marchands et coordonnées bancaires pour la réception automatique des paiements (MTN, Moov, Celtiis, Banque).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MTN MoMo */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>1. MTN Mobile Money (MoMo)</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Numéro Marchand MTN
                </label>
                <input
                  type="text"
                  value={form.momo_number || ''}
                  onChange={(e) => setForm({ ...form, momo_number: e.target.value })}
                  placeholder="Ex: 97000000"
                  className="field font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Nom du compte marchand MTN
                </label>
                <input
                  type="text"
                  value={form.momo_name || ''}
                  onChange={(e) => setForm({ ...form, momo_name: e.target.value })}
                  placeholder="Ex: Bénin Réflexologie Sarl"
                  className="field"
                />
              </div>
            </div>
          </div>

          {/* Moov Money (Flooz) */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>2. Moov Money (Flooz)</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Numéro Marchand Moov
                </label>
                <input
                  type="text"
                  value={form.moov_number || ''}
                  onChange={(e) => setForm({ ...form, moov_number: e.target.value })}
                  placeholder="Ex: 95000000"
                  className="field font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Nom du compte marchand Moov
                </label>
                <input
                  type="text"
                  value={form.moov_name || ''}
                  onChange={(e) => setForm({ ...form, moov_name: e.target.value })}
                  placeholder="Ex: Bénin Réflexologie Sarl"
                  className="field"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Préfixe Code USSD Moov (Facultatif)
                </label>
                <input
                  type="text"
                  value={form.moov_ussd || ''}
                  onChange={(e) => setForm({ ...form, moov_ussd: e.target.value })}
                  placeholder="Ex: *155*1*1*"
                  className="field font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Celtiis Cash */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>3. Celtiis Cash</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Numéro Marchand Celtiis
                </label>
                <input
                  type="text"
                  value={form.celtiis_number || ''}
                  onChange={(e) => setForm({ ...form, celtiis_number: e.target.value })}
                  placeholder="Ex: 40000000"
                  className="field font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Nom du compte marchand Celtiis
                </label>
                <input
                  type="text"
                  value={form.celtiis_name || ''}
                  onChange={(e) => setForm({ ...form, celtiis_name: e.target.value })}
                  placeholder="Ex: Bénin Réflexologie Sarl"
                  className="field"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Préfixe Code USSD Celtiis (Facultatif)
                </label>
                <input
                  type="text"
                  value={form.celtiis_ussd || ''}
                  onChange={(e) => setForm({ ...form, celtiis_ussd: e.target.value })}
                  placeholder="Ex: *888*1*"
                  className="field font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Compte Bancaire / Virement */}
          <div className="p-4 rounded-2xl bg-stone-900/10 border border-stone-800/20 space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-800" />
              <span>4. Compte Bancaire (RIB / IBAN)</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Nom de la banque
                </label>
                <input
                  type="text"
                  value={form.bank_name || ''}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  placeholder="Ex: Ecobank Bénin / BOA"
                  className="field"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Intitulé du compte
                </label>
                <input
                  type="text"
                  value={form.bank_account_name || ''}
                  onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                  placeholder="Ex: Bénin Réflexologie Sarl"
                  className="field"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Numéro IBAN / RIB
                </label>
                <input
                  type="text"
                  value={form.bank_iban || ''}
                  onChange={(e) => setForm({ ...form, bank_iban: e.target.value })}
                  placeholder="Ex: BJ66 0100 1001 123456789012 34"
                  className="field font-mono font-bold text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Loyalty Program */}
      <div className="card-soft p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-gold" />
          <h3 className="font-display text-xl text-cacao font-medium">
            Programme de Fidélité
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Seuil de séances pour le palier
            </label>
            <input
              type="number"
              min="2"
              max="50"
              value={form.loyalty_threshold ?? 11}
              onChange={(e) => setForm({ ...form, loyalty_threshold: Number(e.target.value) })}
              className="field font-bold"
            />
            <p className="text-[10px] text-cacao/50 mt-1">
              Défaut : 11 séances (la 11e séance déclenche la remise).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Pourcentage de réduction fidélité (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.loyalty_percent ?? 15}
              onChange={(e) => setForm({ ...form, loyalty_percent: Number(e.target.value) })}
              className="field font-bold"
            />
            <p className="text-[10px] text-cacao/50 mt-1">
              Défaut : 15% de remise appliquée sur la facture.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Personnalisation du Cockpit Pro (Colonnes & Réorganisation des Tabs) */}
      <div className="card-soft p-6 sm:p-8 space-y-6 border border-gold/30 bg-white/80 dark:bg-stone-900/80 shadow-md">
        <div className="flex items-center justify-between pb-2 border-b border-cacao/10">
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                Personnalisation du Cockpit Pro
              </h3>
              <p className="text-xs text-cacao/65 dark:text-sand/65">
                Ajustez le nombre de colonnes de la grille interactive et organisez l'ordre de vos rubriques. La bascule Tabs/Grille se fait directement depuis l'en-tête du Cockpit.
              </p>
            </div>
          </div>
        </div>

        {/* Colonnes de la Grille (2 à 5 colonnes) */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-cacao dark:text-sand">
            <span>Disposition de la Grille (2 à 5 cartes par ligne)</span>
            <span className="text-gold font-mono font-black text-sm">{cockpitGridCols} colonnes ({cockpitGridCols === 2 ? '10 lignes' : cockpitGridCols === 3 ? '7 lignes' : cockpitGridCols === 4 ? '5 lignes' : '4 lignes'})</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[2, 3, 4, 5].map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => {
                  setCockpitGridCols(cols);
                  localStorage.setItem(`brm_cockpit_cols_${roleKey}`, String(cols));
                  window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
                }}
                className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1 border ${
                  cockpitGridCols === cols
                    ? 'bg-gold text-stone-950 border-gold shadow-sm font-black'
                    : 'bg-white/70 dark:bg-stone-800 text-cacao dark:text-sand border-cacao/10 hover:border-gold/50'
                }`}
              >
                <span>{cols} Colonnes</span>
              </button>
            ))}
          </div>

          <input
            type="range"
            min="2"
            max="5"
            step="1"
            value={cockpitGridCols}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCockpitGridCols(val);
              localStorage.setItem(`brm_cockpit_cols_${roleKey}`, String(val));
              window.dispatchEvent(new CustomEvent('brm-cockpit-layout-change'));
            }}
            className="w-full accent-gold cursor-pointer"
          />
          <p className="text-[10px] text-cacao/60 dark:text-sand/60">
            Ajustez la disposition pour afficher de 2 à 5 grandes cartes par ligne (2 colonnes = 10 lignes, 3 colonnes, 4 colonnes, 5 colonnes = 4 lignes).
          </p>
        </div>

        {/* Réorganisation de l'ordre des Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-gold" />
              <span>Réorganisation de l'ordre des Tabs (Flèches Haut/Bas)</span>
            </h4>
            <button
              type="button"
              onClick={resetTabsOrder}
              className="text-xs text-cacao/60 hover:text-cacao dark:text-sand/60 dark:hover:text-sand inline-flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser l'ordre</span>
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {orderedTabs.map((tabKey, idx) => {
              const def = DEFAULT_SECTIONS_DEF.find((s) => s.value === tabKey);
              if (!def) return null;

              return (
                <div
                  key={tabKey}
                  className="p-3 rounded-2xl bg-white/70 dark:bg-stone-800/70 border border-cacao/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-cacao dark:text-sand">{def.label}</span>
                    {def.modOnly && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300">
                        Modérateur
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveTab(idx, 'up')}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-gold hover:text-stone-950 transition disabled:opacity-30 cursor-pointer"
                      title="Monter d'une position"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedTabs.length - 1}
                      onClick={() => moveTab(idx, 'down')}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-gold hover:text-stone-950 transition disabled:opacity-30 cursor-pointer"
                      title="Descendre d'une position"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. VERROUILLAGE CENTRAL DE L'APPLICATION (KILL SWITCH) & COMPTE À REBOURS - Modérateur UNIQUEMENT */}
      {isModerator && (
        <div className="card-soft p-6 sm:p-8 space-y-6 border-2 border-amber-600/30 bg-gradient-to-br from-white via-amber-500/5 to-rose-500/5 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 shadow-xl rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-cacao dark:text-sand font-bold">
                  Verrouillage Central de l'Application (Kill Switch)
                </h3>
                <p className="text-xs text-cacao/65 dark:text-sand/65">
                  Interrupteur d'urgence immédiat, écran de fermeture sécurisé et programmation de compte à rebours.
                </p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5 ${
              isLocked ? 'bg-rose-500 text-white shadow-md animate-pulse' : 'bg-emerald-500 text-stone-950 shadow-sm'
            }`}>
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isLocked ? 'Verrouillé' : 'Opérationnel'}</span>
            </span>
          </div>

          {/* Gros Bouton Power d'Action Immédiate */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 ${
            isLocked
              ? 'bg-rose-500/10 border-rose-500/40 shadow-inner'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform ${
                isLocked ? 'bg-rose-500 text-white scale-105' : 'bg-emerald-500 text-stone-950'
              }`}>
                <Power className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-lg font-bold text-cacao dark:text-sand">
                  {isLocked ? 'Application Actuellement VERROUILLÉE' : 'Application Actuellement EN LIGNE'}
                </h4>
                <p className="text-xs text-cacao/70 dark:text-sand/70 max-w-md">
                  {isLocked
                    ? "Toutes les pages publiques (réservations, messagerie, boutique) sont bloquées par l'écran de verrouillage avec mot de passe."
                    : "L'ensemble du public accède librement aux services et à la réservation en ligne."}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={togglingLock}
              onClick={handleImmediateLockToggle}
              className={`py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2.5 shadow-lg cursor-pointer shrink-0 ${
                isLocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-102'
                  : 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-102 animate-pulse'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {togglingLock
                  ? 'Action en cours...'
                  : isLocked
                  ? "DÉVERROUILLER L'ACCÈS PUBLIC"
                  : "VERROUILLER IMMÉDIATEMENT (KILL SWITCH)"}
              </span>
            </button>
          </div>

          {/* Paramètres de l'écran de verrouillage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-gold" />
                <span>Message affiché sur l'écran de verrouillage</span>
              </label>
              <textarea
                rows={3}
                value={lockMessage}
                onChange={(e) => setLockMessage(e.target.value)}
                placeholder="Ex: Le centre est momentanément fermé pour travaux..."
                className="field text-xs sm:text-sm resize-none leading-relaxed"
              />
              <p className="text-[10px] text-cacao/50 dark:text-sand/50">
                Ce texte est présenté aux clients et visiteurs lorsque l'application est verrouillée.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-gold" />
                <span>Mot de passe d'accès d'urgence (Défaut : Acces)</span>
              </label>
              <input
                type="text"
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                placeholder="Acces"
                className="field font-mono font-bold text-sm"
              />
              <p className="text-[10px] text-cacao/50 dark:text-sand/50">
                Permet à un client ou collaborateur autorisé de contourner le verrouillage localement. Les comptes modérateurs ne sont jamais bloqués.
              </p>
            </div>
          </div>

          {/* Section Compte à Rebours (Timer de fermeture automatique) */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-gold" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-cacao dark:text-sand">
                    Compte à Rebours de Verrouillage Automatique
                  </h4>
                  <p className="text-[11px] text-cacao/65 dark:text-sand/65">
                    Planifie une date et heure d'arrêt. À échéance, l'application se verrouille automatiquement.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isCountdownActive}
                  onChange={(e) => setIsCountdownActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>

            {isCountdownActive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-500/20 text-xs sm:text-sm">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                    Date & Heure d'expiration (Mois, Jour, Heure, Minute)
                  </label>
                  <input
                    type="datetime-local"
                    value={countdownDate}
                    onChange={(e) => setCountdownDate(e.target.value)}
                    className="field text-xs sm:text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                    Message de la bannière du décompte (Staff uniquement)
                  </label>
                  <input
                    type="text"
                    value={countdownMessage}
                    onChange={(e) => setCountdownMessage(e.target.value)}
                    placeholder="Ex: Fermeture programmée du centre pour maintenance."
                    className="field text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Gouvernance du Thème (Modérateur UNIQUEMENT) */}
      {isModerator && (
        <div className="card-soft p-6 sm:p-8 space-y-4 border border-cacao/10 bg-white/80 dark:bg-stone-900/80 shadow-md">
          <div className="flex items-center gap-2.5 pb-2 border-b border-cacao/10">
            <Palette className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                Harmonisation & Forçage du Thème Global
              </h3>
              <p className="text-xs text-cacao/65 dark:text-sand/65">
                Si activé, ce thème écrase les préférences locales de tous les clients et collaborateurs en temps réel.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-bold text-xs sm:text-sm text-cacao dark:text-sand">
                Forcer le thème officiel pour tous
              </span>
              <p className="text-[11px] text-cacao/65 dark:text-sand/65">
                Verrouille l'identité visuelle de l'ensemble de l'application sur le thème sélectionné.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={forceGlobalTheme}
                onChange={(e) => setForceGlobalTheme(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {THEMES.map((themeItem) => (
              <button
                key={themeItem.value}
                type="button"
                onClick={() => setSelectedGlobalTheme(themeItem.value)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                  selectedGlobalTheme === themeItem.value
                    ? 'border-gold bg-gold/15 shadow-sm'
                    : 'border-cacao/10 hover:border-gold/50 bg-white/70 dark:bg-stone-900/60'
                }`}
              >
                <div>
                  <h5 className="font-bold text-xs text-cacao dark:text-sand">{themeItem.label}</h5>
                  <p className="text-[10px] text-cacao/60 dark:text-sand/60">{themeItem.hint}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {themeItem.swatch.map((c, i) => (
                    <span
                      key={i}
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
