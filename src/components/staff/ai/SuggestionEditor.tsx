import ListEditor from './ListEditor';

interface SuggestionEditorProps {
  mode: 'auto' | 'fixed' | 'off';
  fixedSuggestions: string[];
  onModeChange: (mode: 'auto' | 'fixed' | 'off') => void;
  onFixedChange: (suggestions: string[]) => void;
}

export default function SuggestionEditor({
  mode,
  fixedSuggestions,
  onModeChange,
  onFixedChange,
}: SuggestionEditorProps) {
  return (
    <div className="space-y-4 font-body">
      <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block">
        Mode des questions suggérées (Chips de dialogue)
      </label>

      <div className="grid grid-cols-3 gap-2">
        {[
          { value: 'auto', label: 'Automatique (IA / Contexte)' },
          { value: 'fixed', label: 'Liste imposée' },
          { value: 'off', label: 'Désactivé' },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onModeChange(opt.value as any)}
            className={`p-3 rounded-2xl border text-xs font-semibold transition cursor-pointer text-center ${
              mode === opt.value
                ? 'bg-cacao text-sand border-cacao shadow-sm'
                : 'bg-white/60 text-cacao/70 border-cacao/10 hover:bg-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === 'fixed' && (
        <div className="pt-2">
          <ListEditor
            title="Questions suggérées imposées"
            items={fixedSuggestions}
            onChange={onFixedChange}
            placeholder="Ex: Quels sont vos forfaits ?"
          />
        </div>
      )}
    </div>
  );
}
