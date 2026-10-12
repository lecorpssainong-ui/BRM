import { Check } from 'lucide-react';

interface QuestionFieldProps {
  question: { label: string; options?: string[] };
  mode: 'confirm' | 'checklist' | 'choice' | 'scale' | 'text';
  value: any;
  onChange: (val: any) => void;
}

export default function QuestionField({
  question,
  mode,
  value,
  onChange,
}: QuestionFieldProps) {
  const options = question.options || [];

  return (
    <div className="space-y-3 font-body">
      <label className="text-sm font-semibold text-cacao block leading-snug">
        {question.label}
      </label>

      {/* CONFIRM MODE (Oui / Non) */}
      {mode === 'confirm' && (
        <div className="flex gap-3">
          {['Oui', 'Non'].map((opt) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex-1 py-3 rounded-2xl border text-sm font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-cacao text-sand border-cacao shadow-md'
                    : 'bg-white/70 text-cacao border-cacao/10 hover:border-gold'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* CHOICE MODE (Single choice) */}
      {mode === 'choice' && (
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`w-full p-3.5 rounded-2xl border text-left text-sm transition flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-gold/15 border-gold text-cacao font-semibold shadow-sm'
                    : 'bg-white/70 border-cacao/10 text-cacao/80 hover:bg-white'
                }`}
              >
                <span>{opt}</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-gold text-cacao' : 'border border-cacao/20'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* CHECKLIST MODE (Multiple choice) */}
      {mode === 'checklist' && (
        <div className="space-y-2">
          {options.map((opt) => {
            const selectedList: string[] = Array.isArray(value) ? value : [];
            const isChecked = selectedList.includes(opt);

            const toggle = () => {
              if (isChecked) {
                onChange(selectedList.filter((x) => x !== opt));
              } else {
                onChange([...selectedList, opt]);
              }
            };

            return (
              <button
                key={opt}
                type="button"
                onClick={toggle}
                className={`w-full p-3.5 rounded-2xl border text-left text-sm transition flex items-center justify-between gap-3 cursor-pointer ${
                  isChecked
                    ? 'bg-gold/15 border-gold text-cacao font-semibold'
                    : 'bg-white/70 border-cacao/10 text-cacao/80 hover:bg-white'
                }`}
              >
                <span>{opt}</span>
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-gold text-cacao' : 'border border-cacao/20 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* SCALE MODE (0 to 10 slider) */}
      {mode === 'scale' && (
        <div className="p-4 rounded-2xl bg-white/70 border border-cacao/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-cacao/60">
            <span>0 • Nulle</span>
            <span className="font-bold text-lg text-cacao">{value ?? 5} / 10</span>
            <span>10 • Intense</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={value ?? 5}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-gold cursor-pointer"
          />
        </div>
      )}

      {/* TEXT MODE */}
      {mode === 'text' && (
        <textarea
          rows={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Écrivez votre réponse en toute liberté..."
          className="field resize-none text-xs sm:text-sm"
        />
      )}
    </div>
  );
}
