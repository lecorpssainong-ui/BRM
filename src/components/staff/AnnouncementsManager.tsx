import { useState, useEffect } from 'react';
import { useAnnouncements } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import AnnouncementForm from './announcements/AnnouncementForm';
import { Sparkles, Plus, Pencil, Trash2, Clock, Pin, CalendarHeart, ShoppingBag, Video, MessageCircle } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';
import { deleteRecordWithConfirm } from '@/lib/deleteHelper';

interface AnnouncementsManagerProps {
  userRole?: string;
  userName?: string;
}

export default function AnnouncementsManager({
  userRole = 'secretary',
  userName = 'Secrétariat',
}: AnnouncementsManagerProps) {
  const qc = useQueryClient();
  const { data: announcements = [], isLoading } = useAnnouncements();
  const [localAnnouncements, setLocalAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (announcements) setLocalAnnouncements(announcements);
  }, [announcements]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const handleSave = async (data: any) => {
    if (editingItem?.id) {
      await base44.entities.Announcement.update(editingItem.id, data);
      toast({ title: 'Statut / Story mis à jour', variant: 'success' });
    } else {
      await base44.entities.Announcement.create(data);
      toast({ title: 'Nouveau Statut / Story publié', variant: 'success' });
    }
    qc.invalidateQueries({ queryKey: ['announcements'] });
  };

  const handleDelete = async (id: string) => {
    const success = await deleteRecordWithConfirm(id, {
      tableName: 'announcements',
      base44Entity: 'Announcement',
      confirmMessage: 'Voulez-vous supprimer définitivement ce statut / story ?',
      successMessage: 'Statut supprimé.',
    });
    if (success) {
      setLocalAnnouncements((prev) => prev.filter((item) => item.id !== id));
      qc.invalidateQueries({ queryKey: ['announcements'] });
    }
  };

  const now = new Date().getTime();

  return (
    <div className="space-y-6 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-0.5">Communication interactive</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Statuts & Stories Accueil
          </h2>
          <p className="text-xs text-cacao/65 mt-0.5">
            Publiez des statuts au format stories Instagram / Messenger affichés en haut de l'accueil.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
          className="btn-gold py-2.5 px-5 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Story / Statut</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-28 rounded-3xl bg-white/40 animate-pulse" />
        </div>
      ) : localAnnouncements.length === 0 ? (
        <div className="card-soft p-12 text-center max-w-md mx-auto my-8">
          <Sparkles className="w-12 h-12 text-gold mx-auto mb-3" />
          <h4 className="font-display text-xl text-cacao">Aucun statut publié</h4>
          <p className="text-xs text-cacao/65 mt-1">Créez votre première story promotionnelle ou d'actualité.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localAnnouncements.map((item: any) => {
            const isProgrammed = item.publish_at && new Date(item.publish_at).getTime() > now;
            const isExpired = item.expires_at && new Date(item.expires_at).getTime() < now;

            return (
              <div
                key={item.id}
                className="card-soft p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-cacao/10"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Story Ring Thumbnail */}
                  <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-700 ring-2 ring-amber-400/40 overflow-hidden shrink-0">
                    {Boolean(item.image_url && item.image_url.trim()) ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#3D2619] flex items-center justify-center font-bold text-xs text-amber-300">
                        ✦
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-medium text-base text-cacao truncate">
                        {item.title || item.author_name || 'Statut'}
                      </span>

                      {item.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Pin className="w-3 h-3" />
                          <span>Épinglé</span>
                        </span>
                      )}

                      {isProgrammed && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          <span>Programmé : {formatDate(item.publish_at)}</span>
                        </span>
                      )}

                      {isExpired && (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                          Expiré
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-cacao/75 line-clamp-2">
                      {item.text}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-cacao/55 pt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold text-[10px]">
                        Nuance : {item.tone || 'gold'}
                      </span>

                      {item.link_type === 'massage' && (
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
                          <CalendarHeart className="w-3 h-3" /> Soin : {item.link_target_name || 'Lié'}
                        </span>
                      )}

                      {item.link_type === 'product' && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" /> Produit : {item.link_target_name || 'Lié'}
                        </span>
                      )}

                      {item.link_type === 'video' && (
                        <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
                          <Video className="w-3 h-3" /> Vidéo : {item.link_target_name || 'Liée'}
                        </span>
                      )}

                      {item.link_type === 'whatsapp' && (
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> WhatsApp direct
                        </span>
                      )}

                      {item.button_label && (
                        <span>Bouton : « {item.button_label} »</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setFormOpen(true);
                    }}
                    className="p-2 rounded-xl text-cacao/70 hover:text-cacao hover:bg-cacao/10 transition cursor-pointer"
                    title="Modifier la story"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    title="Supprimer la story"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnnouncementForm
        isOpen={formOpen}
        initialData={editingItem}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        userRole={userRole}
        userName={userName}
      />
    </div>
  );
}
