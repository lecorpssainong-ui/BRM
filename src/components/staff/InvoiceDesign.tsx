import { useState, useEffect, useRef } from 'react';
import { useAppSettings } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { formatPrice } from '@/lib/format';
import { toast } from '@/components/ui/toaster';
import { Palette, Eye, Save, Sparkles, Check, Upload, Image as ImageIcon, Trash2, Link as LinkIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { logActivity } from '@/lib/activityLogger';

export default function InvoiceDesign() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        invoice_title: settings.invoice_title || 'FACTURE',
        invoice_logo_url: settings.invoice_logo_url || settings.logo_url || '',
        invoice_show_logo: settings.invoice_show_logo !== false,
        invoice_bg_url: settings.invoice_bg_url || '',
        invoice_bg_opacity: settings.invoice_bg_opacity ?? 10,
        invoice_accent: settings.invoice_accent || '#b8864b',
        invoice_show_address: settings.invoice_show_address !== false,
        invoice_show_landmark: settings.invoice_show_landmark !== false,
        invoice_show_contact: settings.invoice_show_contact !== false,
        invoice_show_hours: settings.invoice_show_hours !== false,
        invoice_show_number: settings.invoice_show_number !== false,
        invoice_show_issued_by: settings.invoice_show_issued_by !== false,
        invoice_show_discounts: settings.invoice_show_discounts !== false,
        invoice_show_next: settings.invoice_show_next !== false,
        invoice_show_notes: settings.invoice_show_notes !== false,
        invoice_footer: settings.invoice_footer || 'Merci de votre confiance — prenez soin de vous.',
        invoice_note: settings.invoice_note || 'Dispensé de TVA sous le régime des centres de soins de bien-être.',
      });
    }
  }, [settings]);

  const handleImageFileRead = (file: File, targetField: 'invoice_logo_url' | 'invoice_bg_url') => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setForm((prev: any) => ({ ...prev, [targetField]: base64 }));
        toast({
          title: 'Image chargée en aperçu',
          description: `L'image a été convertie en Base64 et appliquée immédiatement.`,
          variant: 'success',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
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
        await base44.entities.AppSettings.update(settings.id, form);
      } else {
        await base44.entities.AppSettings.create(form);
      }
      logActivity({
        table: 'AppSettings',
        action: 'update',
        description: 'Mise à jour du design et de la mise en page des factures',
      });
      toast({ title: 'Design de facture enregistré', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="eyebrow block mb-0.5">Atelier graphique</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Design & Mise en page des Factures
          </h2>
          <p className="text-xs text-cacao/65 mt-0.5">
            Personnalisez l'en-tête, les filigranes, la couleur d'accent et les mentions des PDF imprimés.
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer le design'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Controls form (6 cols) */}
        <div className="lg:col-span-6 card-soft p-6 sm:p-8 space-y-6">
          <h3 className="font-display text-xl text-cacao font-medium border-b border-cacao/10 pb-2">
            Paramètres visuels
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Titre du document
              </label>
              <input
                type="text"
                value={form.invoice_title || ''}
                onChange={(e) => setForm({ ...form, invoice_title: e.target.value })}
                className="field"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Couleur d'accent (Hex)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.invoice_accent || '#b8864b'}
                  onChange={(e) => setForm({ ...form, invoice_accent: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-cacao/20 p-1 bg-white"
                />
                <input
                  type="text"
                  value={form.invoice_accent || '#b8864b'}
                  onChange={(e) => setForm({ ...form, invoice_accent: e.target.value })}
                  className="field font-mono"
                />
              </div>
            </div>

            {/* Logo de la facture */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block">
                Logo de la facture (Fichier image local ou URL)
              </label>

              <div className="flex items-center gap-3">
                {form.invoice_logo_url ? (
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-cacao/20 bg-white p-1 shrink-0 shadow-xs">
                    <img
                      src={form.invoice_logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, invoice_logo_url: '' })}
                      className="absolute top-0.5 right-0.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                      title="Retirer le logo"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-cacao/20 flex items-center justify-center text-cacao/40 shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFileRead(file, 'invoice_logo_url');
                    }}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="btn-soft text-xs py-2 px-3 inline-flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-gold" />
                      <span>{form.invoice_logo_url ? "Changer l'image" : "Choisir une photo locale"}</span>
                    </button>
                    {form.invoice_logo_url && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        Prêt pour la facture
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.invoice_logo_url || ''}
                    onChange={(e) => setForm({ ...form, invoice_logo_url: e.target.value })}
                    placeholder="Ou coller une URL d'image (https://...)"
                    className="field text-xs py-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Arrière-plan filigrane */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block">
                Filigrane d'arrière-plan (Fichier image local ou URL)
              </label>

              <div className="flex items-center gap-3">
                {form.invoice_bg_url ? (
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-cacao/20 bg-stone-100 p-1 shrink-0 shadow-xs">
                    <img
                      src={form.invoice_bg_url}
                      alt="Watermark preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, invoice_bg_url: '' })}
                      className="absolute top-0.5 right-0.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                      title="Retirer le filigrane"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-cacao/20 flex items-center justify-center text-cacao/40 shrink-0">
                    <Palette className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFileRead(file, 'invoice_bg_url');
                    }}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bgInputRef.current?.click()}
                      className="btn-soft text-xs py-2 px-3 inline-flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-gold" />
                      <span>{form.invoice_bg_url ? "Changer le filigrane" : "Choisir un visuel local"}</span>
                    </button>
                    {form.invoice_bg_url && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        Filigrane actif
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.invoice_bg_url || ''}
                    onChange={(e) => setForm({ ...form, invoice_bg_url: e.target.value })}
                    placeholder="Ou coller une URL d'image (https://...)"
                    className="field text-xs py-1.5"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="font-semibold uppercase tracking-wider text-cacao/70">
                  Opacité du filigrane : {form.invoice_bg_opacity || 10}%
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="90"
                value={form.invoice_bg_opacity || 10}
                onChange={(e) => setForm({ ...form, invoice_bg_opacity: Number(e.target.value) })}
                className="w-full accent-gold cursor-pointer"
              />
            </div>

            {/* Checkbox toggles */}
            <div className="pt-3 border-t border-cacao/10 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao/60 block mb-1">
                Affichage des éléments
              </span>

              {[
                { key: 'invoice_show_logo', label: 'Afficher le logo en en-tête' },
                { key: 'invoice_show_address', label: 'Afficher l\'adresse du centre' },
                { key: 'invoice_show_landmark', label: 'Afficher le repère & quartier' },
                { key: 'invoice_show_contact', label: 'Afficher les contacts (téléphone, email)' },
                { key: 'invoice_show_hours', label: 'Afficher les horaires d\'ouverture' },
                { key: 'invoice_show_number', label: 'Afficher le numéro de facture' },
                { key: 'invoice_show_issued_by', label: 'Afficher « Émise par »' },
                { key: 'invoice_show_discounts', label: 'Afficher la colonne des remises' },
                { key: 'invoice_show_next', label: 'Afficher le prochain rendez-vous convenu' },
                { key: 'invoice_show_notes', label: 'Afficher les notes complémentaires' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form[item.key])}
                    onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                    className="w-4 h-4 rounded text-gold focus:ring-gold"
                  />
                  <span className="text-xs text-cacao/80">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Pied de page
              </label>
              <input
                type="text"
                value={form.invoice_footer || ''}
                onChange={(e) => setForm({ ...form, invoice_footer: e.target.value })}
                className="field"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Mention légale
              </label>
              <input
                type="text"
                value={form.invoice_note || ''}
                onChange={(e) => setForm({ ...form, invoice_note: e.target.value })}
                className="field text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right: Live Preview of Document (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
            <Eye className="w-4 h-4" />
            <span>Aperçu fidèle du rendu PDF</span>
          </div>

          <div
            className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-cacao/20 text-[11px] text-stone-900 font-sans relative"
            style={{
              minHeight: '520px',
            }}
          >
            {/* Top Header Band */}
            <div className="bg-[#2a1c15] text-white p-5 relative">
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ backgroundColor: form.invoice_accent || '#b8864b' }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base tracking-wide">
                    {settings?.center_name || 'Bénin Réflexologie Massage'}
                  </h4>
                  {form.invoice_show_address && (
                    <p className="text-[10px] text-stone-300 mt-1">
                      {[settings?.address, form.invoice_show_landmark ? settings?.center_landmark : null, settings?.center_city].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {form.invoice_show_contact && (
                    <p className="text-[10px] text-stone-300">
                      Tél : {settings?.center_phone || '+229 97 00 00 00'}
                    </p>
                  )}
                  {form.invoice_show_hours && (
                    <p className="text-[9px] text-stone-400">
                      {settings?.opening_hours || '08h00 - 20h00'}
                    </p>
                  )}
                </div>

                {form.invoice_show_logo && Boolean(form.invoice_logo_url && form.invoice_logo_url.trim()) && (
                  <img
                    src={form.invoice_logo_url}
                    alt=""
                    className="w-12 h-12 object-contain rounded-lg bg-white/10"
                  />
                )}
              </div>
            </div>

            {/* Meta Row */}
            <div className="p-5 flex justify-between items-start border-b border-stone-200">
              <div>
                <span
                  className="font-bold text-[9px] uppercase tracking-wider block"
                  style={{ color: form.invoice_accent || '#b8864b' }}
                >
                  CLIENT
                </span>
                <span className="font-bold text-sm text-stone-950 block">Mme Awa Dossou</span>
                <span className="text-[10px] text-stone-600">Tél : +229 97 00 00 00</span>
              </div>

              <div className="text-right">
                <span className="font-bold text-base text-stone-950 block">
                  {form.invoice_title || 'FACTURE'}
                </span>
                {form.invoice_show_number && (
                  <span className="text-[10px] text-stone-600 block">N° BRM-2026-842</span>
                )}
                <span className="text-[10px] text-stone-600 block">Date : 29 Septembre 2026</span>
                {form.invoice_show_issued_by && (
                  <span className="text-[9px] text-stone-500 block">Émise par : Secrétariat</span>
                )}
              </div>
            </div>

            {/* Sample Table */}
            <div className="p-5 space-y-3">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-stone-300 font-bold text-stone-700">
                    <th className="pb-1.5">PRESTATION</th>
                    <th className="pb-1.5 text-center">QTÉ</th>
                    <th className="pb-1.5 text-right">P.U.</th>
                    {form.invoice_show_discounts && <th className="pb-1.5 text-right">REMISE</th>}
                    <th className="pb-1.5 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-2 font-medium">Réflexologie Plantaire Thérapeutique</td>
                    <td className="py-2 text-center">10</td>
                    <td className="py-2 text-right">15 000 FCFA</td>
                    {form.invoice_show_discounts && (
                      <td className="py-2 text-right text-amber-700 font-semibold">-10%</td>
                    )}
                    <td className="py-2 text-right font-bold">135 000 FCFA</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="pt-3 border-t border-stone-200 flex flex-col items-end gap-1 text-[10px]">
                <div className="flex justify-between w-48 text-stone-600">
                  <span>Sous-total :</span>
                  <span>150 000 FCFA</span>
                </div>
                {form.invoice_show_discounts && (
                  <div className="flex justify-between w-48 text-amber-700 font-semibold">
                    <span>Remises :</span>
                    <span>-15 000 FCFA</span>
                  </div>
                )}
                <div className="mt-1 p-2 rounded bg-[#2a1c15] text-white flex justify-between w-48 font-bold text-xs">
                  <span>TOTAL :</span>
                  <span style={{ color: form.invoice_accent || '#b8864b' }}>135 000 FCFA</span>
                </div>
              </div>

              {/* Next session */}
              {form.invoice_show_next && (
                <div className="p-2.5 rounded bg-stone-100 text-[10px] space-y-0.5">
                  <span
                    className="font-bold text-[8px] uppercase tracking-wider block"
                    style={{ color: form.invoice_accent || '#b8864b' }}
                  >
                    PROCHAIN RENDEZ-VOUS
                  </span>
                  <span>Massage Suédois Relaxant • Vendredi 3 Octobre à 10h00</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-auto p-4 text-center border-t border-stone-200 text-[9px] text-stone-500">
              <p className="italic">{form.invoice_footer}</p>
              {form.invoice_note && <p className="mt-0.5 opacity-80">{form.invoice_note}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
