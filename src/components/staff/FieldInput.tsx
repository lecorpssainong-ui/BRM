import { useState, useEffect } from 'react';
import { EntityField } from '@/lib/staffEntities';
import MediaUploader from '@/components/MediaUploader';
import { useProducts } from '@/lib/queries';
import { mockStore } from '@/lib/mockStore';
import { Sparkles, Tag, Plus } from 'lucide-react';

interface FieldInputProps {
  field: EntityField;
  value: any;
  onChange: (val: any) => void;
  allValues?: any;
}

export default function FieldInput({ field, value, onChange, allValues = {} }: FieldInputProps) {
  const { name, label, type, required, options, hint } = field;
  const { data: products = [] } = useProducts();
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await mockStore.getProductCategories();
        setExistingCategories(cats.filter((c) => c !== 'all'));
      } catch {
        // ignore
      }
    }
    if (name === 'category') {
      loadCats();
    }
  }, [name, products]);

  const isMediaField =
    (type as string) === 'media' ||
    (type as string) === 'image' ||
    (type as string) === 'video' ||
    name.includes('image_url') ||
    name.includes('thumbnail_url') ||
    name.includes('video_url');

  if (isMediaField) {
    const isStrictVideo = (type as string) === 'video' || name.includes('video_url');
    return (
      <MediaUploader
        label={label}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        mediaType={isStrictVideo ? 'video' : 'any'}
        accept={isStrictVideo ? 'video/*' : 'image/*,video/*,.gif,.webp'}
        hint={hint || 'Accepte image (JPG, PNG, WebP), animation GIF ou courte vidéo MP4.'}
      />
    );
  }

  // Live Auto-Calculated Discount preview if current field is price or discount_percent
  const originalPrice = Number(allValues.original_price || 0);
  const currentPrice = Number(allValues.price || 0);
  const hasAutoDiscount = originalPrice > currentPrice && currentPrice > 0;
  const calculatedDiscount = hasAutoDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  return (
    <div className="space-y-1.5 font-body">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        {name === 'discount_percent' && hasAutoDiscount && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
            Auto-calculé : -{calculatedDiscount}%
          </span>
        )}
      </div>

      {/* CATEGORY FIELD WITH AUTOCOMPLETE & QUICK CHIPS */}
      {name === 'category' ? (
        <div className="space-y-2">
          <input
            type="text"
            list="product-categories-list"
            required={required}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ex: Huiles Essentielles, Baumes, Coffrets..."
            className="field text-xs sm:text-sm py-2.5"
          />
          <datalist id="product-categories-list">
            {existingCategories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>

          {existingCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-cacao/50 font-medium">Catégories existantes :</span>
              {existingCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onChange(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 border ${
                    value === cat
                      ? 'bg-gold text-stone-950 font-bold border-gold shadow-xs'
                      : 'bg-white/70 hover:bg-white text-cacao/80 border-cacao/10'
                  }`}
                >
                  <Tag className="w-2.5 h-2.5 opacity-60" />
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : type === 'text' ? (
        <input
          type="text"
          required={required}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="field text-xs sm:text-sm py-2.5"
        />
      ) : null}

      {/* TEXTAREA */}
      {type === 'textarea' && (
        <textarea
          rows={3}
          required={required}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="field text-xs sm:text-sm py-2.5 resize-none leading-relaxed"
        />
      )}

      {/* NUMBER */}
      {type === 'number' && (
        <div className="space-y-1">
          <input
            type="number"
            required={required}
            value={value ?? ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className="field text-xs sm:text-sm py-2.5"
          />
          {name === 'price' && hasAutoDiscount && (
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold" />
              Économie client : {(originalPrice - currentPrice).toLocaleString('fr-FR')} FCFA (-{calculatedDiscount}%)
            </p>
          )}
        </div>
      )}

      {/* DATETIME */}
      {type === 'datetime' && (
        <input
          type="datetime-local"
          required={required}
          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
          className="field text-xs sm:text-sm py-2.5"
        />
      )}

      {/* BOOLEAN */}
      {type === 'boolean' && (
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded text-gold focus:ring-gold"
          />
          <span className="text-xs text-cacao/80 font-medium">Activé</span>
        </label>
      )}

      {/* SELECT */}
      {type === 'select' && (
        <select
          value={value ?? options?.[0]?.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="field text-xs sm:text-sm py-2.5 cursor-pointer"
        >
          {options?.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* LIST (string array, one per line) */}
      {type === 'list' && (
        <textarea
          rows={3}
          value={Array.isArray(value) ? value.join('\n') : value ?? ''}
          onChange={(e) => onChange(e.target.value.split('\n'))}
          placeholder="Un élément par ligne"
          className="field text-xs sm:text-sm py-2.5 resize-none"
        />
      )}

      {hint && <p className="text-[10px] text-cacao/50">{hint}</p>}
    </div>
  );
}
