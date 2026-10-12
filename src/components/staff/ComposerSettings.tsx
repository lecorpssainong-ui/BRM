import { useState, useEffect, useRef } from 'react';
import { useAppSettings } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/toaster';
import {
  MessageSquare,
  Save,
  Plus,
  Trash2,
  Upload,
  Palette,
  Image as ImageIcon,
  Sparkles,
  Eye,
  Sliders,
  SendHorizontal,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { logActivity } from '@/lib/activityLogger';

export default function ComposerSettings() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  const [form, setForm] = useState<any>({
    msg_composer_height: 34,
    msg_composer_width: 100,
    // Body background
    msg_body_bg_color: '#f5eee6',
    msg_body_bg_url: '',
    msg_body_bg_opacity: 100,
    // Composer input background
    msg_bg_color: '#ffffff',
    msg_bg_url: '',
    msg_bg_opacity: 100,
    msg_text_color: '#2A1C15',
    msg_show_file: true,
    msg_show_location: true,
    msg_show_voice: true,
    msg_voice_max: 60,
    msg_quick_replies: [],
  });

  const [newReply, setNewReply] = useState('');
  const [saving, setSaving] = useState(false);
  const bodyFileInputRef = useRef<HTMLInputElement>(null);
  const composerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        msg_composer_height: settings.msg_composer_height ?? 34,
        msg_composer_width: settings.msg_composer_width ?? 100,
        msg_body_bg_color: settings.msg_body_bg_color || '#f5eee6',
        msg_body_bg_url: settings.msg_body_bg_url || '',
        msg_body_bg_opacity: settings.msg_body_bg_opacity ?? 100,
        msg_bg_color: settings.msg_bg_color || '#ffffff',
        msg_bg_url: settings.msg_bg_url || '',
        msg_bg_opacity: settings.msg_bg_opacity ?? 100,
        msg_text_color: settings.msg_text_color || '#2A1C15',
        msg_show_file: settings.msg_show_file !== false,
        msg_show_location: settings.msg_show_location !== false,
        msg_show_voice: settings.msg_show_voice !== false,
        msg_voice_max: settings.msg_voice_max ?? 60,
        msg_quick_replies: Array.isArray(settings.msg_quick_replies) ? settings.msg_quick_replies : [],
      });
    }
  }, [settings]);

  const handleImageRead = (file: File, targetField: 'msg_body_bg_url' | 'msg_bg_url') => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setForm((prev: any) => ({ ...prev, [targetField]: base64 }));
        toast({
          title: 'Image chargée en Base64',
          description: 'Aperçu immédiat appliqué dans la prévisualisation.',
          variant: 'success',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddReply = () => {
    if (!newReply.trim()) return;
    setForm((prev: any) => ({
      ...prev,
      msg_quick_replies: [...prev.msg_quick_replies, newReply.trim()],
    }));
    setNewReply('');
  };

  const handleRemoveReply = (idx: number) => {
    setForm((prev: any) => ({
      ...prev,
      msg_quick_replies: prev.msg_quick_replies.filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, form);
      } else {
        await base44.entities.AppSettings.create(form);
      }
      logActivity({
        table: 'AppSettings',
        action: 'update',
        description: 'Mise à jour du design et des arrière-plans de la messagerie',
      });
      toast({ title: 'Réglages messagerie enregistrés', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card-soft p-6 sm:p-8 space-y-8 font-body max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-cacao/10">
        <div>
          <span className="eyebrow block mb-0.5">Interface de dialogue</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            Design & Habillage de la Messagerie
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-0.5">
            Personnalisez l'arrière-plan du corps de la conversation, le style du champ de saisie et les réponses rapides.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer le design'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne gauche : Paramètres (7 colonnes) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1 : Arrière-plan du Corps de la Conversation */}
          <div className="card-soft p-5 sm:p-6 space-y-4 border border-cacao/10 bg-white/70 dark:bg-stone-900/70 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-cacao/10">
              <Palette className="w-4 h-4 text-gold" />
              <h3 className="font-display text-lg text-cacao dark:text-sand font-medium">
                Arrière-plan du Corps de la Conversation
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block mb-1">
                  Couleur de fond & Opacité
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.msg_body_bg_color || '#f5eee6'}
                    onChange={(e) => setForm({ ...form, msg_body_bg_color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-cacao/20 p-1 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={form.msg_body_bg_color || '#f5eee6'}
                    onChange={(e) => setForm({ ...form, msg_body_bg_color: e.target.value })}
                    className="field font-mono text-xs w-32"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-cacao/70 dark:text-sand/70 mb-0.5">
                      <span>Opacité :</span>
                      <span>{form.msg_body_bg_opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={form.msg_body_bg_opacity ?? 100}
                      onChange={(e) => setForm({ ...form, msg_body_bg_opacity: Number(e.target.value) })}
                      className="w-full accent-gold cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block mb-1">
                  Image de fond du body (Upload local Base64 ou URL)
                </label>
                <input
                  ref={bodyFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageRead(file, 'msg_body_bg_url');
                  }}
                  className="hidden"
                />

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => bodyFileInputRef.current?.click()}
                    className="btn-soft text-xs py-2 px-3 inline-flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-gold" />
                    <span>Choisir une photo locale (Base64)</span>
                  </button>
                  {form.msg_body_bg_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, msg_body_bg_url: '' })}
                      className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={form.msg_body_bg_url || ''}
                  onChange={(e) => setForm({ ...form, msg_body_bg_url: e.target.value })}
                  placeholder="Ou URL externe : https://..."
                  className="field text-xs py-1.5"
                />
              </div>
            </div>
          </div>

          {/* Section 2 : Arrière-plan du Champ de Texte (Composer) */}
          <div className="card-soft p-5 sm:p-6 space-y-4 border border-cacao/10 bg-white/70 dark:bg-stone-900/70 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-cacao/10">
              <MessageSquare className="w-4 h-4 text-gold" />
              <h3 className="font-display text-lg text-cacao dark:text-sand font-medium">
                Arrière-plan du Champ de Saisie (Composer)
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block mb-1">
                  Couleur du champ & Opacité
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.msg_bg_color || '#ffffff'}
                    onChange={(e) => setForm({ ...form, msg_bg_color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-cacao/20 p-1 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={form.msg_bg_color || '#ffffff'}
                    onChange={(e) => setForm({ ...form, msg_bg_color: e.target.value })}
                    className="field font-mono text-xs w-32"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-cacao/70 dark:text-sand/70 mb-0.5">
                      <span>Opacité du champ :</span>
                      <span>{form.msg_bg_opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={form.msg_bg_opacity ?? 100}
                      onChange={(e) => setForm({ ...form, msg_bg_opacity: Number(e.target.value) })}
                      className="w-full accent-gold cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block mb-1">
                  Image de fond du champ (Upload local Base64 ou URL)
                </label>
                <input
                  ref={composerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageRead(file, 'msg_bg_url');
                  }}
                  className="hidden"
                />

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => composerFileInputRef.current?.click()}
                    className="btn-soft text-xs py-2 px-3 inline-flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-gold" />
                    <span>Choisir une photo locale (Base64)</span>
                  </button>
                  {form.msg_bg_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, msg_bg_url: '' })}
                      className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={form.msg_bg_url || ''}
                  onChange={(e) => setForm({ ...form, msg_bg_url: e.target.value })}
                  placeholder="Ou URL externe : https://..."
                  className="field text-xs py-1.5"
                />
              </div>
            </div>
          </div>

          {/* Section 3 : Dimensions & Boutons */}
          <div className="card-soft p-5 sm:p-6 space-y-4 border border-cacao/10 bg-white/70 dark:bg-stone-900/70 shadow-sm">
            <h3 className="font-display text-lg text-cacao dark:text-sand font-medium pb-2 border-b border-cacao/10">
              Dimensions & Boutons
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between mb-1 text-[11px] text-cacao/70 dark:text-sand/70">
                  <span>Hauteur initiale ({form.msg_composer_height ?? 34}% de l'écran)</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="60"
                  value={form.msg_composer_height ?? 34}
                  onChange={(e) => setForm({ ...form, msg_composer_height: Number(e.target.value) })}
                  className="w-full accent-gold cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[11px] text-cacao/70 dark:text-sand/70">
                  <span>Largeur du champ ({form.msg_composer_width ?? 100}%)</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={form.msg_composer_width ?? 100}
                  onChange={(e) => setForm({ ...form, msg_composer_width: Number(e.target.value) })}
                  className="w-full accent-gold cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.msg_show_file}
                  onChange={(e) => setForm({ ...form, msg_show_file: e.target.checked })}
                  className="w-4 h-4 rounded text-gold focus:ring-gold"
                />
                <span className="text-cacao/80 dark:text-sand/80">Bouton Fichier</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.msg_show_location}
                  onChange={(e) => setForm({ ...form, msg_show_location: e.target.checked })}
                  className="w-4 h-4 rounded text-gold focus:ring-gold"
                />
                <span className="text-cacao/80 dark:text-sand/80">Bouton Position</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.msg_show_voice}
                  onChange={(e) => setForm({ ...form, msg_show_voice: e.target.checked })}
                  className="w-4 h-4 rounded text-gold focus:ring-gold"
                />
                <span className="text-cacao/80 dark:text-sand/80">Bouton Vocal</span>
              </label>
            </div>
          </div>
        </div>

        {/* Colonne droite : Prévisualisation en direct (5 colonnes) */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center gap-2 font-display text-sm font-semibold text-cacao dark:text-sand">
            <Eye className="w-4 h-4 text-gold" />
            <span>Aperçu en Direct de la Messagerie</span>
          </div>

          <div
            className="rounded-3xl border border-cacao/15 p-4 shadow-xl overflow-hidden min-h-[420px] flex flex-col justify-between transition-all"
            style={{
              backgroundColor: form.msg_body_bg_color || '#f5eee6',
              backgroundImage: form.msg_body_bg_url ? `url(${form.msg_body_bg_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: (form.msg_body_bg_opacity ?? 100) / 100,
            }}
          >
            {/* Bulles simulées */}
            <div className="space-y-3 pt-2">
              <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-xs bg-white/90 dark:bg-stone-800/90 text-cacao dark:text-sand text-xs shadow-sm border border-cacao/10">
                <p className="font-semibold text-[11px] text-gold mb-0.5">Le Secrétariat</p>
                <span>Bonjour ! Comment pouvons-nous vous accompagner aujourd'hui ?</span>
              </div>

              <div className="max-w-[80%] ml-auto p-3 rounded-2xl rounded-tr-xs bg-cacao text-sand text-xs shadow-sm border border-gold/20">
                <p className="font-semibold text-[11px] text-gold mb-0.5">Vous (Client)</p>
                <span>Je souhaite réserver une séance de réflexologie plantaire.</span>
              </div>
            </div>

            {/* Champ de saisie simulé */}
            <div className="pt-4">
              <div
                className="p-3 rounded-2xl border border-cacao/15 shadow-md flex flex-col justify-between transition-all"
                style={{
                  backgroundColor: form.msg_bg_color || '#ffffff',
                  backgroundImage: form.msg_bg_url ? `url(${form.msg_bg_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: (form.msg_bg_opacity ?? 100) / 100,
                  width: `${form.msg_composer_width}%`,
                  margin: '0 auto',
                }}
              >
                <div className="text-xs text-cacao/50 dark:text-sand/50 italic mb-2">
                  Écrivez votre message ici...
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-cacao/10">
                  <div className="flex items-center gap-1.5 text-cacao/60 dark:text-sand/60">
                    {form.msg_show_file && <span className="text-[10px] bg-cacao/10 px-2 py-0.5 rounded">📎 Photo</span>}
                    {form.msg_show_voice && <span className="text-[10px] bg-cacao/10 px-2 py-0.5 rounded">🎙️ Vocal</span>}
                  </div>

                  <div className="w-7 h-7 rounded-xl bg-gold text-stone-950 flex items-center justify-center shadow-xs">
                    <SendHorizontal className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
