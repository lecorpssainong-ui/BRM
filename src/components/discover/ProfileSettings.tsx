import { useState, useEffect, FormEvent } from 'react';
import { useProfile, saveProfile, clearClientSession } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useAppSettings } from '@/lib/queries';
import { THEMES } from '@/components/ThemeApplier';
import { LANGUAGES, SupportedLanguage, useLanguage } from '@/lib/i18n';
import AutoMedia from '@/components/shared/AutoMedia';
import {
  User,
  Phone,
  CheckCircle2,
  Save,
  LogOut,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Palette,
  Lock,
  Shield,
  Briefcase,
  LogIn,
  UserPlus,
  Sparkles,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { setAuthReturnTo } from '@/lib/authReturnTo';
import DataSaverSettings from '@/components/client/DataSaverSettings';

export default function ProfileSettings() {
  const profile = useProfile();
  const { user, logout, updateUserProfile } = useAuth();
  const { data: settings } = useAppSettings();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Profile edit state for authenticated users
  const [nom, setNom] = useState(user?.nom || profile?.name || '');
  const [prenoms, setPrenoms] = useState(user?.prenoms || '');
  const [telephone, setTelephone] = useState(user?.telephone || profile?.phone || '');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if user loads
  useEffect(() => {
    if (user) {
      setNom(user.nom || '');
      setPrenoms(user.prenoms || '');
      setTelephone(user.telephone || '');
    } else if (profile?.name) {
      setNom(profile.name);
      setTelephone(profile.phone || '');
    }
  }, [user, profile]);

  // Language management via global LanguageContext
  const { language: currentLang, setLanguage: applyLanguageContext, t } = useLanguage();

  const handleSelectLanguage = async (langCode: SupportedLanguage) => {
    await applyLanguageContext(langCode);

    const langObj = LANGUAGES.find((l) => l.code === langCode);
    toast({
      title: 'Langue de l’application mise à jour',
      description: `L'application est maintenant configurée en : ${langObj?.flag} ${langObj?.nativeName || langCode}.`,
      variant: 'success',
    });
  };

  // Theme management
  const isThemeForced = settings?.force_global_theme === true;
  const currentGlobalTheme = settings?.theme || 'cacao';
  const [selectedUserTheme, setSelectedUserTheme] = useState(() => {
    return localStorage.getItem('brm_user_theme') || currentGlobalTheme;
  });

  const handleSelectTheme = (themeKey: string) => {
    if (isThemeForced) {
      toast({
        title: 'Thème imposé par la modération',
        description: 'Le modérateur du centre a activé l’harmonisation globale pour tous les utilisateurs.',
        variant: 'default',
      });
      return;
    }
    setSelectedUserTheme(themeKey);
    localStorage.setItem('brm_user_theme', themeKey);
    document.documentElement.dataset.theme = themeKey;
    window.dispatchEvent(new Event('brm-theme-change'));
    toast({
      title: 'Thème d’affichage appliqué',
      description: `Ambiance visuelle changée pour : ${THEMES.find((t) => t.value === themeKey)?.label}`,
      variant: 'success',
    });
  };

  // Profile update submit
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Veuillez saisir votre nom complet.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const fullName = `${nom.trim()} ${prenoms.trim()}`.trim();
      const cleanPhone = telephone.trim();

      await saveProfile({
        name: fullName,
        phone: cleanPhone || undefined,
      });

      if (user) {
        await updateUserProfile({
          nom: nom.trim(),
          prenoms: prenoms.trim(),
          full_name: fullName,
          telephone: cleanPhone,
        });
      }

      setSavedSuccess(true);
      toast({
        title: 'Profil mis à jour',
        description: 'Vos coordonnées ont été enregistrées avec succès.',
        variant: 'success',
      });
      setTimeout(() => setSavedSuccess(false), 2200);
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible d’enregistrer le profil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSession = () => {
    clearClientSession(queryClient);
    setNom('');
    setPrenoms('');
    setTelephone('');
    setWhatsappPhone('');
    toast({
      title: 'Session réinitialisée',
      description: 'L’état local a été totalement purgé.',
      variant: 'default',
    });
  };

  const currentRole = user?.role || (profile as any)?.role || 'client';
  const isSecretary = currentRole === 'secretary';
  const isModerator = currentRole === 'moderator';
  const showSecretaryButton = isSecretary || isModerator;
  const showModeratorButton = isModerator;
  const canAccessStaffCockpit = showSecretaryButton;

  return (
    <div className="space-y-8 max-w-2xl mx-auto font-body">
      {/* 1. SECTION AUTHENTIFICATION / COMPTE SÉCURISÉ */}
      <div className="card-soft p-6 sm:p-8 space-y-5 border border-cacao/10 bg-white/80 dark:bg-stone-900/80 shadow-md">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-cacao/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-gold flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="eyebrow block text-[10px]">{t('profile.identityAndSecurity')}</span>
              <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                {t('profile.secureAccount')}
              </h3>
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('profile.logout')}</span>
            </button>
          )}
        </div>

        {user ? (
          /* Utilisateur connecté : Synthèse de session */
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-cacao dark:text-sand truncate">
                  {user.nom} {user.prenoms || ''}
                </span>

                {/* Badges de Pouvoirs */}
                {isModerator && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gold text-stone-950 shadow-xs flex items-center gap-1">
                    <Shield className="w-3 h-3 fill-current" />
                    <span>{t('profile.moderator')}</span>
                  </span>
                )}
                {isSecretary && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                    {t('profile.secretary')}
                  </span>
                )}
                {!isModerator && !isSecretary && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    {t('profile.sanctuaryClient')}
                  </span>
                )}
              </div>

              <p className="text-xs text-cacao/75 dark:text-sand/75">
                {t('profile.googleAccount')} : <strong className="text-cacao dark:text-sand">{user.email}</strong>
              </p>
              {user.telephone && (
                <p className="text-xs text-cacao/75 dark:text-sand/75 font-mono">
                  {t('profile.contactPhone')} : {user.telephone}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Utilisateur NON connecté : Redirection directe vers /login */
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cacao to-cacao/90 text-gold flex items-center justify-center mx-auto shadow-md border border-gold/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-lg text-cacao dark:text-sand font-medium">
                {t('settings.accessAccount')}
              </h4>
              <p className="text-xs text-cacao/75 dark:text-sand/75 max-w-sm mx-auto leading-relaxed">
                {t('settings.accessAccountHelp')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthReturnTo('/decouvertes?tab=settings');
                  navigate('/login');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-cacao text-sand hover:bg-cacao/90 dark:bg-gold dark:text-cacao dark:hover:bg-gold/90 font-bold text-xs sm:text-sm transition shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('settings.loginBtn')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. SECTION MON PROFIL (VISIBLE UNIQUEMENT SI CONNECTÉ) */}
      {user && (
        <div className="card-soft p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cacao/10">
            <div>
              <span className="eyebrow block mb-1">{t('settings.personalInfo')}</span>
              <h3 className="font-display text-2xl text-cacao dark:text-sand font-medium">
                {t('settings.myProfile')}
              </h3>
              <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-1 font-body">
                {t('settings.personalInfoSubtitle')}
              </p>
            </div>

            {profile && (
              <button
                type="button"
                onClick={handleResetSession}
                className="btn-soft py-2 px-3 text-xs inline-flex items-center gap-1.5 text-rose-700 hover:bg-rose-50 hover:text-rose-800 self-start sm:self-auto cursor-pointer"
                title={t('settings.resetSession')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('settings.resetSession')}</span>
              </button>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 font-body">
            {/* Champ Téléphone Contact - Librement Modifiable & Optionnel */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block mb-1.5">
                {t('settings.phoneContact')}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gold absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex : 01 97 00 00 00"
                  className="field pl-10"
                />
              </div>
              <p className="text-[11px] text-cacao/55 dark:text-sand/55 mt-1">
                {t('settings.phoneContactHelp')}
              </p>
            </div>

            {/* Champ Nom (Modifiable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block mb-1.5">
                  {t('profile.fullName')} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-cacao/40 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: Dossou"
                    className="field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block mb-1.5">
                  {t('profile.firstName')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-cacao/40 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={prenoms}
                    onChange={(e) => setPrenoms(e.target.value)}
                    placeholder="Ex: Awa"
                    className="field pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Champ WhatsApp secondaire (Optionnel) */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block mb-1.5">
                {t('settings.whatsappSecondary')}
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-cacao/40 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="Ex: +229 95 00 00 00"
                  className="field pl-10"
                />
              </div>
              <p className="text-[11px] text-cacao/55 dark:text-sand/55 mt-1">
                {t('settings.whatsappHelp')}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving || !nom.trim()}
                className="btn-gold text-xs sm:text-sm py-2.5 px-6 inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-cacao" />
                    <span>{t('settings.savedSuccess')}</span>
                  </>
                ) : saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
                    <span>{t('settings.saving')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('settings.saveChanges')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. SECTION LANGUE DE L'APPLICATION (VISIBLE POUR TOUS : CONNECTÉ OU VISITEUR) */}
      <div className="card-soft p-6 sm:p-8 space-y-4 border border-cacao/10 bg-white/80 dark:bg-stone-900/80 shadow-md">
        <div className="flex items-center gap-3 pb-2 border-b border-cacao/10">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-gold flex items-center justify-center shadow-xs">
            <Globe className="w-5 h-5 text-gold" />
          </div>
          <div>
            <span className="eyebrow block text-[10px]">{t('settings.languageTitle')}</span>
            <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
              {t('settings.languageTitle')}
            </h3>
            <p className="text-xs text-cacao/65 dark:text-sand/65">
              {t('settings.languageSubtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2.5 transition cursor-pointer relative ${
                  isSelected
                    ? 'border-gold bg-gold/15 shadow-md ring-2 ring-gold/60'
                    : 'border-cacao/10 hover:border-gold/40 bg-white/80 dark:bg-stone-900/60'
                }`}
              >
                {/* Cercle doré autour de la langue active */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                    isSelected
                      ? 'ring-3 ring-gold ring-offset-2 ring-offset-sand dark:ring-offset-[#1C1410] scale-105 shadow-md bg-gold/20'
                      : 'bg-black/5 dark:bg-white/5'
                  }`}
                >
                  <span>{lang.flag}</span>
                </div>

                <div className="space-y-0.5 text-center">
                  <span className="font-bold text-xs text-cacao dark:text-sand block">
                    {lang.nativeName}
                  </span>
                  <span className="text-[10px] text-cacao/60 dark:text-sand/60 block">
                    {lang.name}
                  </span>
                </div>

                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-gold shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CARD THÈME CLIENT */}
      <div className="card-soft p-6 sm:p-8 space-y-4 border border-cacao/10">
        <div className="flex items-center gap-3 pb-2 border-b border-cacao/10">
          <Palette className="w-5 h-5 text-gold" />
          <div>
            <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
              {t('settings.themeTitle')}
            </h3>
            <p className="text-xs text-cacao/65 dark:text-sand/65">
              {t('settings.themeSubtitle')}
            </p>
          </div>
        </div>

        {isThemeForced ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Lock className="w-4 h-4 text-gold shrink-0" />
            <span>
              <strong>Thème officiel harmonisé :</strong> Le Modérateur a activé le thème <strong>{THEMES.find((t) => t.value === currentGlobalTheme)?.label}</strong> pour tous les utilisateurs.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {THEMES.map((themeItem) => {
              const isSelected = selectedUserTheme === themeItem.value;
              return (
                <button
                  key={themeItem.value}
                  type="button"
                  onClick={() => handleSelectTheme(themeItem.value)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                    isSelected
                      ? 'border-gold bg-gold/15 shadow-sm'
                      : 'border-cacao/10 hover:border-gold/50 bg-white/70 dark:bg-stone-900/60'
                  }`}
                >
                  <div>
                    <h5 className="font-bold text-xs text-cacao dark:text-sand">
                      {themeItem.label}
                    </h5>
                    <p className="text-[10px] text-cacao/60 dark:text-sand/60">
                      {themeItem.hint}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {themeItem.swatch.map((color, idx) => (
                      <span
                        key={idx}
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. CARD DATA SAVER SETTINGS */}
      <DataSaverSettings />

      {/* 
        5. CARD ACCÈS ESPACE PROFESSIONNEL (Strictement dissocié selon rôle en base de données)
        - Non visible pour les simples clients
        - Secrétaire : Bouton unique Secrétariat
        - Modérateur : Boutons indépendants Secrétariat et Modération
      */}
      {canAccessStaffCockpit && (
        <div className="card-soft p-6 sm:p-8 space-y-5 bg-gradient-to-br from-[#1E130D] to-[#2B1B12] text-sand border border-gold/40 shadow-2xl rounded-3xl">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
                  {t('profile.teamPortal')}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-sand">
                  {t('profile.proCockpitTitle')}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {isModerator && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gold text-stone-950">
                  {t('profile.moderator')}
                </span>
              )}
              {isSecretary && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {t('profile.secretary')}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-sand/80 leading-relaxed font-body">
            {t('profile.teamAccessDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Bouton Secrétariat (Accessible à Secrétaire et Modérateur) */}
            {showSecretaryButton && (
              <div className="p-4 rounded-2xl bg-white/5 border border-blue-500/30 hover:border-blue-500/60 flex flex-col justify-between gap-3 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                    <Briefcase className="w-4 h-4" />
                    <span>{t('profile.secretary')}</span>
                  </div>
                  <h4 className="font-display text-lg font-bold text-sand">
                    {t('profile.secretarySpace')}
                  </h4>
                  <p className="text-xs text-sand/70">
                    {t('profile.secretarySpaceDesc')}
                  </p>
                </div>

                <Link
                  to="/staff?tab=secretary"
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all w-full"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{t('profile.proAccessSecretariat')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Bouton Modérateur (Réservé UNIQUEMENT au Modérateur) */}
            {showModeratorButton && (
              <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/40 hover:border-rose-500/60 flex flex-col justify-between gap-3 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    <span>{t('profile.moderationTitle')}</span>
                  </div>
                  <h4 className="font-display text-lg font-bold text-sand">
                    {t('profile.moderatorSpace')}
                  </h4>
                  <p className="text-xs text-sand/70">
                    {t('profile.moderatorSpaceDesc')}
                  </p>
                </div>

                <Link
                  to="/staff?tab=moderator"
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-rose-700 to-rose-600 hover:from-purple-600 hover:to-rose-500 text-white font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all w-full"
                >
                  <Shield className="w-4 h-4" />
                  <span>{t('profile.proAccessModeration')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
