import { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

interface FaqEntry {
  q: string;
  a: string;
  keywords?: string;
}

interface FaqEditorProps {
  faq: FaqEntry[];
  onChange: (faq: FaqEntry[]) => void;
}

export default function FaqEditor({ faq, onChange }: FaqEditorProps) {
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [newKw, setNewKw] = useState('');

  const handleAdd = () => {
    if (!newQ.trim() || !newA.trim()) return;
    onChange([
      ...faq,
      {
        q: newQ.trim(),
        a: newA.trim(),
        keywords: newKw.trim() || undefined,
      },
    ]);
    setNewQ('');
    setNewA('');
    setNewKw('');
  };

  const handleRemove = (idx: number) => {
    onChange(faq.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 font-body">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-gold" />
        <h4 className="font-semibold text-cacao text-sm">
          Foire aux questions interne (FAQ Prioritaire)
        </h4>
      </div>

      <div className="p-4 rounded-2xl bg-white/70 border border-cacao/10 space-y-3">
        <input
          type="text"
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="Question fréquente (Ex: Acceptez-vous les paiements Moov ?)"
          className="field text-xs py-2"
        />
        <textarea
          rows={2}
          value={newA}
          onChange={(e) => setNewA(e.target.value)}
          placeholder="Réponse officielle fournie par le conseiller..."
          className="field text-xs py-2 resize-none"
        />
        <input
          type="text"
          value={newKw}
          onChange={(e) => setNewKw(e.target.value)}
          placeholder="Mots-clés déclencheurs séparés par des espaces (Ex: moov payer argent)"
          className="field text-xs py-2"
        />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!newQ.trim() || !newA.trim()}
            onClick={handleAdd}
            className="btn-gold py-1.5 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter à la FAQ</span>
          </button>
        </div>
      </div>

      {/* List of existing FAQ items */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {faq.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white/50 border border-cacao/10 space-y-1.5 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-cacao">{item.q}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-cacao/40 hover:text-rose-600 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-cacao/75 leading-relaxed">{item.a}</p>
            {item.keywords && (
              <span className="text-[10px] text-gold font-mono block">
                Mots-clés : {item.keywords}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
