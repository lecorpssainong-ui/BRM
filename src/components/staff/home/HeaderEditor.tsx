import { useState, useEffect } from 'react';
import { useAppSettings } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/toaster';
import { Save, Shield } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function HeaderEditor() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  const [headerTitle, setHeaderTitle] = useState('Bénin Réflexologie Massage');
  const [showConseiller, setShowConseiller] = useState(true);
  const [showCommandes, setShowCommandes] = useState(true);
  const [showPro, setShowPro] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setHeaderTitle(settings.header_title || settings.center_name || 'Bénin Réflexologie Massage');
      setShowConseiller(settings.header_show_conseiller !== false);
      setShowCommandes(settings.header_show_commandes !== false);
      setShowPro(settings.header_show_pro !== false);
    }
  }, [
    settings?.header_title,
    settings?.center_name,
    settings?.header_show_conseiller,
    settings?.header_show_commandes,
    settings?.header_show_pro,
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = headerTitle.trim();
    if (!cleanTitle) {
      toast({
        title: 'Titre requis',
        description: 'Veuillez renseigner le nom de l\'application.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        header_title: cleanTitle,
        header_show_conseiller: showConseiller,
        header_show_commandes: showCommandes,
        header_show_pro: showPro,
      };

      // 1. Supabase update (singleton ID)
      const { error: sbErr } = await supabase
        .from('app_settings')
        .update(payload)
        .eq('id', 'a0000000-0000-0000-0000-000000000001');

      if (sbErr) {
        console.warn('Supabase app_settings update error:', sbErr.message);
      }

      // 2. Base44 AppSettings update
      const list = await base44.entities.AppSettings.list();
      const mainSettings = list[0];

      if (mainSettings?.id) {
        await base44.entities.AppSettings.update(mainSettings.id, payload);
      } else {
        await base44.entities.AppSettings.create({
          id: 'settings_default',
          ...payload,
        });
      }

      // Broadcast event & refresh queries
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'AppSettings' } }));
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });

      toast({
        title: 'Paramètres modérateur enregistrés !',
        description: `Le nom "${cleanTitle}" et les options d'en-tête ont été enregistrés avec succès.`,
        variant: 'success',
      });
    } catch (err: any) {
      console.error('Save Header Error:', err);
      toast({
        title: 'Erreur d\'enregistrement',
        description: err?.message || 'Impossible de sauvegarder les paramètres.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card-soft p-6 sm:p-8 space-y-6 font-body">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-cacao/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
              Privilège Exclusif Modérateur
            </span>
            <h4 className="font-display text-xl text-cacao dark:text-sand font-bold">
              Nom Officiel & En-tête de l'Application
            </h4>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-xs sm:text-sm">
        {/* 1. Nom de l'Application */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-cacao/10 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand block">
            Nom Officiel de l'Application (Réservé au Modérateur) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            placeholder="Ex: Bénin Réflexologie Massage ou RBM"
            className="field font-bold text-sm"
          />
          <p className="text-[11px] text-cacao/65 dark:text-sand/65">
            Ce nom s'affiche dans l'en-tête, le titre de l'application et la barre de navigation. Le logo de l'application est quant à lui fixé de façon permanente et sécurisée (/logo-brm-v2.png).
          </p>
        </div>

        {/* 2. Options d'affichage Header */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-cacao/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block">
            Boutons Raccourcis de l'En-tête
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-sand/30 dark:bg-stone-800/40">
              <input
                type="checkbox"
                checked={showConseiller}
                onChange={(e) => setShowConseiller(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span className="text-xs font-semibold text-cacao/80 dark:text-sand/80">Conseiller IA</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-sand/30 dark:bg-stone-800/40">
              <input
                type="checkbox"
                checked={showCommandes}
                onChange={(e) => setShowCommandes(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span className="text-xs font-semibold text-cacao/80 dark:text-sand/80">Commandes Boutique</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-sand/30 dark:bg-stone-800/40">
              <input
                type="checkbox"
                checked={showPro}
                onChange={(e) => setShowPro(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span className="text-xs font-semibold text-cacao/80 dark:text-sand/80">Bouton Espace Pro</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-gold py-3 px-8 text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer la Configuration'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
