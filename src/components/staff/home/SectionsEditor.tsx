import { useState, useEffect } from 'react';
import { useAppSettings } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/toaster';
import { ArrowUp, ArrowDown, Save, Layers } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const DEFAULT_ORDER = ['hero', 'bridges', 'massages', 'videos', 'center', 'momo'];

const SECTION_LABELS: Record<string, { label: string; desc: string }> = {
  hero: { label: 'Bandeau d\'accueil (Hero)', desc: 'Image plein cadre, sur-titre, titres et boutons de réservation.' },
  bridges: { label: 'Accès rapides (Bridges)', desc: 'Carte grand format du Conseiller IA et grille des 6 raccourcis.' },
  massages: { label: 'Collection des Soins', desc: 'Cartes des soins avec durées, tarifs et fiches détaillées.' },
  videos: { label: 'Bandeau Vidéos', desc: 'Défilement horizontal des capsules et auto-soins.' },
  center: { label: 'Carte du Centre', desc: 'Adresse, horaires, coordonnées directes et WhatsApp.' },
  momo: { label: 'Planificateur Mobile Money', desc: 'Calculateur de séances d\'avance, remises et code USSD direct.' },
};

export default function SectionsEditor() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  const [sections, setSections] = useState<string[]>(DEFAULT_ORDER);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (Array.isArray(settings?.home_sections) && settings.home_sections.length > 0) {
      setSections(settings.home_sections);
    } else {
      setSections(DEFAULT_ORDER);
    }
  }, [settings]);

  const move = (idx: number, delta: number) => {
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= sections.length) return;
    const copy = [...sections];
    const item = copy.splice(idx, 1)[0];
    copy.splice(nextIdx, 0, item);
    setSections(copy);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Fallback local immédiat
      try {
        const stored = localStorage.getItem('brm_hero_settings_override');
        const parsed = stored ? JSON.parse(stored) : {};
        parsed.hero_sections_order = sections;
        localStorage.setItem('brm_hero_settings_override', JSON.stringify(parsed));
      } catch (err) {}

      // 2. Supabase app_settings (singleton id = 'a0000000-0000-0000-0000-000000000001')
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .update({
            hero_sections_order: sections,
            updated_at: new Date().toISOString(),
          })
          .eq('id', 'a0000000-0000-0000-0000-000000000001')
          .select()
          .single();

        if (error) {
          console.error('Missing hero column:', error.message || error);
        } else {
          console.log('Update app_settings hero_sections_order:', { data });
        }
      } catch (sbErr: any) {
        console.error('Missing hero column:', sbErr?.message || sbErr);
      }

      // 3. Base44 AppSettings update
      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, {
          home_sections: sections,
          hero_sections_order: sections,
        });
      } else {
        await base44.entities.AppSettings.create({
          home_sections: sections,
          hero_sections_order: sections,
        });
      }
      toast({ title: 'Ordre de l\'accueil mis à jour', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-soft p-6 sm:p-8 space-y-6 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-xl text-cacao font-medium">
            Agencement des Blocs de l'Accueil
          </h4>
          <p className="text-xs text-cacao/60 mt-0.5">
            Réorganisez l'ordre vertical des 6 sections selon vos priorités d'affichage.
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="btn-gold py-2 px-5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer l'ordre</span>
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((key, idx) => {
          const meta = SECTION_LABELS[key] || { label: key, desc: '' };
          return (
            <div
              key={key}
              className="p-4 rounded-2xl bg-white/70 border border-cacao/10 flex items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gold/20 text-gold font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h5 className="font-semibold text-cacao">{meta.label}</h5>
                  <p className="text-xs text-cacao/60 mt-0.5">{meta.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                  className="p-2 rounded-xl bg-cacao/5 text-cacao hover:bg-cacao/10 disabled:opacity-30 transition cursor-pointer"
                  title="Monter"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === sections.length - 1}
                  onClick={() => move(idx, 1)}
                  className="p-2 rounded-xl bg-cacao/5 text-cacao hover:bg-cacao/10 disabled:opacity-30 transition cursor-pointer"
                  title="Descendre"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
