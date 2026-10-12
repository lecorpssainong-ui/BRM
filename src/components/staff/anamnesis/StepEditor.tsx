import { useState, useEffect, FormEvent } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface StepEditorProps {
  anamnesisId: string;
  initialData?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function StepEditor({
  anamnesisId,
  initialData,
  isOpen,
  onClose,
  onSave,
}: StepEditorProps) {
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [mode, setMode] = useState<'confirm' | 'checklist' | 'choice' | 'scale' | 'text'>('choice');
  const [order, setOrder] = useState(1);
  const [questions, setQuestions] = useState<Array<{ label: string; options?: string[] }>>([
    { label: '', options: [] },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setIntro(initialData.intro || '');
      setMode(initialData.mode || 'choice');
      setOrder(initialData.order ?? 1);
      setQuestions(
        Array.isArray(initialData.questions) && initialData.questions.length > 0
          ? initialData.questions
          : [{ label: '', options: [] }]
      );
    } else {
      setTitle('');
      setIntro('');
      setMode('choice');
      setOrder(1);
      setQuestions([{ label: '', options: [] }]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { label: '', options: [] }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, label: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], label };
      return copy;
    });
  };

  const handleOptionsChange = (idx: number, rawText: string) => {
    const opts = rawText.split('\n').filter(Boolean);
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], options: opts };
      return copy;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        anamnesis_id: anamnesisId,
        title: title.trim(),
        intro: intro.trim() || undefined,
        mode,
        order: Number(order) || 1,
        questions: questions.filter((q) => q.label.trim().length > 0),
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
        className="card-soft w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 font-body shadow-2xl border"
      >
        <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
          <h3 className="font-display text-2xl text-cacao font-medium">
            {initialData ? 'Modifier l\'Étape' : 'Ajouter une Étape'}
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
              Titre de l'étape *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Vos sensations actuelles"
              className="field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Introduction lue et affichée
            </label>
            <textarea
              rows={2}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="Indiquez comment vous vous sentez..."
              className="field resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Mode de réponse
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="field"
              >
                <option value="confirm">Oui / Non (confirm)</option>
                <option value="choice">Choix unique (choice)</option>
                <option value="checklist">Cases à cocher multiples (checklist)</option>
                <option value="scale">Curseur d'intensité 0-10 (scale)</option>
                <option value="text">Texte libre (text)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Ordre
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="field"
              />
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao/70">
                Questions de cette étape
              </span>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une question</span>
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-3.5 rounded-2xl bg-white/70 border border-cacao/10 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cacao/60">
                      Question {qIdx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-cacao/40 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    value={q.label || ''}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    placeholder="Libellé de la question..."
                    className="field py-1.5 text-xs"
                  />

                  {['choice', 'checklist'].includes(mode) && (
                    <div>
                      <label className="text-[10px] text-cacao/60 block mb-0.5">
                        Options possibles (une par ligne) :
                      </label>
                      <textarea
                        rows={2}
                        value={(q.options || []).join('\n')}
                        onChange={(e) => handleOptionsChange(qIdx, e.target.value)}
                        placeholder="Option 1&#10;Option 2"
                        className="field py-1 text-xs resize-none"
                      />
                    </div>
                  )}
                </div>
              ))}
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
              disabled={saving || !title.trim()}
              className="btn-gold py-2 px-6 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer l'étape</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
