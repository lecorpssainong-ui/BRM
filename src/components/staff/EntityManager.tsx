import { useState, useEffect } from 'react';
import { EntityField } from '@/lib/staffEntities';
import EntityFormDialog from './EntityFormDialog';
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { toast } from '@/components/ui/toaster';

interface EntityManagerProps {
  title: string;
  subtitle?: string;
  items: any[];
  fields: EntityField[];
  onSave: (data: any, isEdit: boolean) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  renderRow?: (item: any, onEdit: () => void, onDelete: () => void) => React.ReactNode;
}

export default function EntityManager({
  title,
  subtitle,
  items,
  fields,
  onSave,
  onDelete,
  renderRow,
}: EntityManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [localItems, setLocalItems] = useState<any[]>(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Immediate local state update
      setLocalItems((prev) => prev.filter((item) => item.id !== id));
      await onDelete(id);
      toast({ title: 'Élément supprimé', variant: 'default' });
    } catch {
      // Rollback on failure
      setLocalItems(items);
      toast({ title: 'Erreur de suppression', variant: 'destructive' });
    }
  };

  const handleSave = async (data: any) => {
    try {
      const res = await onSave(data, Boolean(editingItem));
      const savedItem = res || data;
      setLocalItems((prev) => {
        if (editingItem && editingItem.id) {
          return prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...savedItem } : item
          );
        } else {
          return [{ ...savedItem, id: savedItem.id || crypto.randomUUID() }, ...prev];
        }
      });
      setDialogOpen(false);
      toast({
        title: editingItem ? 'Modifications enregistrées' : 'Nouvel élément créé',
        variant: 'success',
      });
    } catch {
      toast({ title: 'Erreur d\'enregistrement', variant: 'destructive' });
    }
  };

  // Deduplicate items safely by ID
  const uniqueItems = (() => {
    const seen = new Set<string>();
    return (localItems || []).filter((item) => {
      if (!item) return false;
      const key = item.id || JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-cacao/60 mt-0.5 font-body">{subtitle}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-gold py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un élément</span>
        </button>
      </div>

      {uniqueItems.length === 0 ? (
        <div className="card-soft p-10 text-center text-xs text-cacao/60">
          Aucun élément enregistré pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {uniqueItems.map((item, index) =>
            renderRow ? (
              <div key={item.id ? `${item.id}-${index}` : `row-${index}`}>
                {renderRow(
                  item,
                  () => handleOpenEdit(item),
                  () => handleDelete(item.id)
                )}
              </div>
            ) : (
              <div
                key={item.id ? `${item.id}-${index}` : `row-${index}`}
                className="card-soft p-4 flex items-center justify-between gap-3 font-body text-xs sm:text-sm"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-cacao truncate">
                    {item.name || item.title || item.text || item.id}
                  </h4>
                  {item.price && (
                    <span className="text-xs text-gold font-bold">
                      {item.price} FCFA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-cacao/70 hover:text-cacao hover:bg-cacao/10 cursor-pointer"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <EntityFormDialog
        title={editingItem ? `Modifier : ${editingItem.name || editingItem.title || 'Élément'}` : `Nouveau : ${title}`}
        fields={fields}
        initialData={editingItem}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
