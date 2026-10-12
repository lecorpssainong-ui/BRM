import { useState, useEffect } from 'react';
import { useAppSettings } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { TOOLS, modeOf, powerOf } from '@/lib/credits';
import ToolCreditCard from './credits/ToolCreditCard';
import {
  Sliders,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Save,
  Sparkles,
  ShieldAlert,
  Clock,
  Check,
  X,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { logActivity } from '@/lib/activityLogger';

interface ModerationItem {
  id: string;
  type: 'appointment' | 'order' | 'review' | 'client';
  title: string;
  author: string;
  details: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ModerationCreditPanel() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  // Sub-tabs
  const [subTab, setSubTab] = useState<'credits' | 'validation'>('credits');

  // Modes & Powers
  const [modes, setModes] = useState<Record<string, 'standard' | 'integration'>>({});
  const [powers, setPowers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  // Moderation queue
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>(() => {
    try {
      const raw = localStorage.getItem('brm_moderation_queue');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'mod_1',
        type: 'review',
        title: 'Témoignage sur le Massage Suédois',
        author: 'Dossou K.',
        details: 'Excellente séance de réflexologie et massage complet, je me sens libéré de toute tension au réveil.',
        date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'pending',
      },
      {
        id: 'mod_2',
        type: 'appointment',
        title: 'Demande urgente de réflexologie à domicile',
        author: 'Marcelle A.',
        details: 'Séance souhaitée ce samedi à 16h avec protocole détente nerveuse.',
        date: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        status: 'pending',
      },
      {
        id: 'mod_3',
        type: 'client',
        title: 'Vérification de profil VIP & Fidélité',
        author: 'Dr Saliou M.',
        details: 'Attribution du palier fidélité -15% sur la 11ème séance.',
        date: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        status: 'approved',
      },
    ];
  });

  useEffect(() => {
    if (settings) {
      const m: Record<string, 'standard' | 'integration'> = {};
      const p: Record<string, number> = {};
      TOOLS.forEach((t) => {
        m[t.key] = modeOf(settings, t.key);
        p[t.key] = powerOf(settings, t.key);
      });
      setModes(m);
      setPowers(p);
    }
  }, [settings]);

  const handleSaveCredits = async () => {
    setSaving(true);
    const updates: any = {};
    TOOLS.forEach((t) => {
      updates[`${t.key}_mode`] = modes[t.key] || 'standard';
      updates[`${t.key}_power`] = powers[t.key] || 5;
    });

    try {
      // 1. Supabase app_settings (singleton id = 'a0000000-0000-0000-0000-000000000001')
      const { data, error } = await supabase
        .from('app_settings')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', 'a0000000-0000-0000-0000-000000000001')
        .select()
        .single();

      console.log('Update app_settings:', { data, error });

      // 2. Base44 AppSettings update
      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, updates);
      } else {
        await base44.entities.AppSettings.create(updates);
      }
      logActivity({
        table: 'AppSettings',
        action: 'update',
        description: 'Mise à jour des modes et curseurs de puissance des outils IA',
      });
      toast({ title: 'Modes & crédits enregistrés avec succès', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    } finally {
      setSaving(false);
    }
  };

  const handleValidationAction = (id: string, newStatus: 'approved' | 'rejected') => {
    const updated = moderationItems.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setModerationItems(updated);
    localStorage.setItem('brm_moderation_queue', JSON.stringify(updated));

    const target = moderationItems.find((i) => i.id === id);
    logActivity({
      table: 'Moderation',
      action: 'update',
      description: `${newStatus === 'approved' ? 'Validation' : 'Rejet'} de la demande '${target?.title}' par ${target?.author}`,
    });

    toast({
      title: newStatus === 'approved' ? 'Élément validé' : 'Élément rejeté',
      description: `Le statut de "${target?.title}" a été mis à jour.`,
      variant: newStatus === 'approved' ? 'success' : 'default',
    });
  };

  return (
    <div className="space-y-8 font-body max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-cacao/10">
        <div>
          <span className="eyebrow block mb-0.5">Contrôle & Intelligence</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            Modération & Crédits
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-0.5">
            Gérez les puissances des outils IA et le système de validation/rejet des requêtes du centre.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-cacao/10 shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('credits')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'credits'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-gold" />
            <span>Modes & Crédits IA</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('validation')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'validation'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>Système Validation / Rejet</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1 : Modes & Crédits */}
      {subTab === 'credits' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cacao/70 dark:text-sand/70">
              Ajustez la puissance (1 à 10) et le mode (Standard Local gratuit vs Intégration avancée) pour chaque outil du centre.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveCredits}
              className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les crédits'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {TOOLS.map((tool) => (
              <ToolCreditCard
                key={tool.key}
                tool={tool}
                mode={modes[tool.key] || 'standard'}
                power={powers[tool.key] || 5}
                onModeChange={(m) => setModes((prev) => ({ ...prev, [tool.key]: m }))}
                onPowerChange={(p) => setPowers((prev) => ({ ...prev, [tool.key]: p }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2 : Système Validation / Rejet */}
      {subTab === 'validation' && (
        <div className="space-y-6">
          <div className="card-soft p-6 sm:p-8 space-y-4 border border-cacao/10 bg-white/80 dark:bg-stone-900/80 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-cacao/10">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-gold" />
                <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                  File de Modération Active ({moderationItems.filter((i) => i.status === 'pending').length} en attente)
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {moderationItems.map((item) => (
                <div
                  key={item.id}
                  className={`card-soft p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition ${
                    item.status === 'approved'
                      ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : item.status === 'rejected'
                      ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 opacity-75'
                      : 'border-cacao/10 bg-white/80 dark:bg-stone-900/80 shadow-sm'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-cacao dark:text-sand">
                        {item.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                        {item.type}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'approved'
                          ? 'bg-emerald-600 text-white'
                          : item.status === 'rejected'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-400 text-stone-950'
                      }`}>
                        {item.status === 'approved' ? 'Validé' : item.status === 'rejected' ? 'Rejeté' : 'En attente'}
                      </span>
                    </div>

                    <p className="text-xs text-cacao/75 dark:text-sand/75 leading-relaxed">
                      {item.details}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-cacao/50 dark:text-sand/50 pt-1">
                      <span>Auteur : <strong>{item.author}</strong></span>
                      <span>•</span>
                      <span>{new Date(item.date).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleValidationAction(item.id, 'approved')}
                      disabled={item.status === 'approved'}
                      className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleValidationAction(item.id, 'rejected')}
                      disabled={item.status === 'rejected'}
                      className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Rejeter</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
