import { useState, useEffect, FormEvent } from 'react';
import { EntityField } from '@/lib/staffEntities';
import FieldInput from './FieldInput';
import { X, Save } from 'lucide-react';

interface EntityFormDialogProps {
  title: string;
  fields: EntityField[];
  initialData?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function EntityFormDialog({
  title,
  fields,
  initialData,
  isOpen,
  onClose,
  onSave,
}: EntityFormDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      const defaults: any = {};
      fields.forEach((f) => {
        if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      });
      setFormData(defaults);
    }
  }, [initialData, fields, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
      <div
        style={{
          backgroundColor: 'rgb(var(--sand))',
          color: 'rgb(var(--cacao))',
          borderColor: 'rgb(var(--cacao) / 0.15)',
        }}
        className="card-soft w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 border shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
          <h3 className="font-display text-2xl text-cacao font-medium">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-cacao/60 hover:text-cacao transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <FieldInput
              key={f.name}
              field={f}
              value={formData[f.name]}
              allValues={formData}
              onChange={(val) => setFormData((prev: any) => ({ ...prev, [f.name]: val }))}
            />
          ))}

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
              disabled={saving}
              className="btn-gold py-2 px-6 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
