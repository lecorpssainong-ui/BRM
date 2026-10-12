import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface ListEditorProps {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export default function ListEditor({
  title,
  items,
  onChange,
  placeholder = 'Ajouter un élément...',
}: ListEditorProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    onChange([...items, input.trim()]);
    setInput('');
  };

  const handleRemove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3 font-body">
      <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block">
        {title}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="field text-xs py-2"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="btn-dark py-2 px-4 text-xs font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-white/70 border border-cacao/10 text-xs flex items-center justify-between gap-2"
          >
            <span className="truncate">{item}</span>
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="text-cacao/40 hover:text-rose-600 transition shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
