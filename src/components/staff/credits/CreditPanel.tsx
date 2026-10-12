import { useState, useEffect } from 'react';
import { useAppSettings } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import { TOOLS, FREE_TOOLS, modeOf, powerOf } from '@/lib/credits';
import ToolCreditCard from './ToolCreditCard';
import { Sliders, ShieldCheck, CheckCircle2, Save } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { useQueryClient } from '@tanstack/react-query';

export default function CreditPanel() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  const [modes, setModes] = useState<Record<string, 'standard' | 'integration'>>({});
  const [powers, setPowers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

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

  const handleModeChange = (key: string, newMode: 'standard' | 'integration') => {
    setModes((prev) => ({ ...prev, [key]: newMode }));
  };

  const handlePowerChange = (key: string, newPower: number) => {
    setPowers((prev) => ({ ...prev, [key]: newPower }));
  };

  const handleSave = async () => {
    setSaving(true);
    const updates: any = {};
    TOOLS.forEach((t) => {
      updates[`${t.key}_mode`] = modes[t.key] || 'standard';
      updates[`${t.key}_power`] = powers[t.key] || 5;
    });

    try {
      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, updates);
      } else {
        await base44.entities.AppSettings.create(updates);
      }
      toast({ title: 'Modes & crédits enregistrés', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-0.5">Économie & Intelligence</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Modes & Crédits d'Intégration
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 mt-0.5">
            Pilotez outil par outil le basculement entre le mode standard local (gratuit) et les intégrations externes.
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer les modes'}</span>
        </button>
      </div>

      {/* Philosophy Reminder Banner */}
      <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-start gap-3.5">
        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Principe Fondateur :</strong> Le mode standard reste totalement gratuit et sans limite : vous pouvez le laisser actif indéfiniment. Tout traitement local (NLP, compression d'images par canvas, génération de PDF, synthèse vocale) consomme 0 crédit.
        </p>
      </div>

      {/* Controllable Tools List */}
      <div className="space-y-6">
        {TOOLS.map((tool) => (
          <ToolCreditCard
            key={tool.key}
            tool={tool}
            mode={modes[tool.key] || 'standard'}
            power={powers[tool.key] || 5}
            onModeChange={(m) => handleModeChange(tool.key, m)}
            onPowerChange={(p) => handlePowerChange(tool.key, p)}
          />
        ))}
      </div>

      {/* Inset of Always Free Tools */}
      <div className="card-soft p-6 sm:p-8 space-y-4 border border-cacao/10">
        <h4 className="font-display text-xl text-cacao font-medium pb-2 border-b border-cacao/10">
          Outils toujours 100% gratuits (Non modifiables)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {FREE_TOOLS.map((ft, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/70 border border-cacao/5 space-y-1.5">
              <span className="font-bold text-cacao block">{ft.label}</span>
              <p className="text-cacao/70 leading-relaxed font-body">{ft.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
