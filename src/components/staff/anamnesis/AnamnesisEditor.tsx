import { useState, useEffect, FormEvent } from 'react';
import { X, Save, Lock } from 'lucide-react';

interface AnamnesisEditorProps {
  initialData?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function AnamnesisEditor({
  initialData,
  isOpen,
  onClose,
  onSave,
}: AnamnesisEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [password, setPassword] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [order, setOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setImageUrl(initialData.image_url || '');
      setPassword(initialData.password || '');
      setWelcomeMessage(initialData.welcome_message || '');
      setOrder(initialData.order ?? 1);
      setActive(initialData.active !== false);
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
      setPassword('');
      setWelcomeMessage('');
      setOrder(1);
      setActive(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        password: password.trim() || undefined,
        welcome_message: welcomeMessage.trim() || undefined,
        order: Number(order) || 1,
        active,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
      <div
        style={{
          backgroundColor: 'rgb(var(--sand))',
          color: 'rgb(var(--cacao))',
          borderColor: 'rgb(var(--cacao) / 0.15)',
        }}
        className="card-soft w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 font-body shadow-2xl border"
      >
        <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
          <h3 className="font-display text-2xl text-cacao font-medium">
            {initialData ? 'Modifier l\'Anamnèse' : 'Nouvelle Anamnèse'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-cacao/60 hover:text-cacao"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Nom du questionnaire *
            </label>
            <input
              type="text"
              required
              value={name || ''}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bilan Vitalité & Zones Réflexes"
              className="field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Description de présentation
            </label>
            <textarea
              rows={2}
              value={description || ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Présentation pour le client..."
              className="field resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              URL de l'image de couverture
            </label>
            <input
              type="text"
              value={imageUrl || ''}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="field"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-gold" />
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70">
                Mot de passe d'accès (laisser vide si accès libre)
              </label>
            </div>
            <input
              type="password"
              value={password || ''}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (vide = ouvert à tous)"
              className="field"
            />
            <p className="text-[10px] text-cacao/50 mt-1">
              Ce mot de passe n'est jamais montré en clair aux clients.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Mot d'accueil prononcé à haute voix au démarrage
            </label>
            <textarea
              rows={2}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Bienvenue dans votre bilan de réflexologie..."
              className="field resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Ordre dans la galerie
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="field"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-gold focus:ring-gold"
                />
                <span className="text-xs font-semibold text-cacao">
                  Visible pour les clients
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-cacao/10 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-soft py-2 px-4 text-xs font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn-gold py-2 px-6 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
