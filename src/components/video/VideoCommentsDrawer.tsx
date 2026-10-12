import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Reply,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CornerDownRight,
  Heart,
  Pencil,
  MoreVertical,
  Check,
} from 'lucide-react';
import { mockStore } from '@/lib/mockStore';
import { useAuth } from '@/lib/AuthContext';
import { useProfile } from '@/lib/clientProfile';
import { formatTimeAgo } from '@/lib/format';
import { toast } from '@/components/ui/toaster';
import { openAuthModal } from '@/lib/authModalHelper';

interface VideoCommentsDrawerProps {
  videoId: string;
  videoTitle?: string;
  commentsEnabled?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoCommentsDrawer({
  videoId,
  videoTitle = 'Vidéo',
  commentsEnabled = true,
  isOpen,
  onClose,
}: VideoCommentsDrawerProps) {
  const { user } = useAuth();
  const profile = useProfile();

  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  // Mode modification
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [activeMenuCommentId, setActiveMenuCommentId] = useState<string | null>(null);

  // Long press timer ref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isStaff = user && ['admin', 'moderator', 'secretary'].includes(user.role);
  const currentUserId = user?.id || profile?.client_key || 'guest_user';
  const currentUserName = user?.full_name || profile?.name || 'Client';

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 300) {
      onClose();
    }
  };

  // Charger les commentaires
  const loadComments = async () => {
    if (!videoId) return;
    try {
      const list = await mockStore.getVideoComments(videoId);
      if (Array.isArray(list)) {
        const seen = new Set<string>();
        const unique = list.filter((item) => {
          if (!item || !item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        setComments(unique);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.warn('Erreur chargement commentaires:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && videoId) {
      setLoading(true);
      loadComments();
    }
  }, [isOpen, videoId]);

  // Écouter les modifications du store en direct
  useEffect(() => {
    const handler = (e: any) => {
      if (!e.detail?.table || e.detail.table === 'video_comments') {
        loadComments();
      }
    };
    window.addEventListener('brm-mockstore-change', handler);
    return () => window.removeEventListener('brm-mockstore-change', handler);
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || submitting || !videoId) return;

    if (!user) {
      openAuthModal({
        reason: 'Pour échanger avec la communauté et publier votre commentaire, veuillez vous identifier.',
      });
      return;
    }

    if (!commentsEnabled) {
      toast({
        title: 'Commentaires désactivés',
        description: 'La publication est restreinte pour cette vidéo.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const authorName =
        user?.full_name ||
        profile?.name ||
        (isStaff ? (user?.role === 'moderator' ? 'Direction Modération' : 'Secrétariat BRM') : 'Client BRM');

      const authorRole = isStaff
        ? user?.role === 'moderator'
          ? 'moderator'
          : 'secretary'
        : 'client';

      const newComment = await mockStore.addVideoComment(videoId, {
        author_id: currentUserId,
        author_name: authorName,
        author_role: authorRole,
        content: inputText.trim(),
        reply_to_id: replyingTo ? replyingTo.id : null,
        reply_author: replyingTo ? replyingTo.author_name : null,
      });

      // Mise à jour sécurisée et dédupliquée
      setComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev;
        return [newComment, ...prev];
      });
      setInputText('');
      setReplyingTo(null);
      toast({
        title: 'Commentaire publié',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de publier votre commentaire.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      // Optimistic update
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const likedBy = Array.isArray(c.liked_by) ? [...c.liked_by] : [];
            const isLiked = likedBy.includes(currentUserId);
            const newLikedBy = isLiked ? likedBy.filter((u) => u !== currentUserId) : [...likedBy, currentUserId];
            const newLikes = Math.max(0, (c.likes || 0) + (isLiked ? -1 : 1));
            return { ...c, likes: newLikes, liked_by: newLikedBy };
          }
          return c;
        })
      );
      await mockStore.toggleVideoCommentLike(commentId, currentUserId);
    } catch {
      loadComments();
    }
  };

  const handleStartEdit = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
    setActiveMenuCommentId(null);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) return;
    try {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: editingText.trim() } : c))
      );
      await mockStore.updateVideoComment(commentId, editingText.trim());
      setEditingCommentId(null);
      toast({ title: 'Commentaire modifié', variant: 'success' });
    } catch {
      toast({ title: 'Erreur lors de la modification', variant: 'destructive' });
      loadComments();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await mockStore.deleteVideoComment(commentId);
      setActiveMenuCommentId(null);
      toast({ title: 'Commentaire supprimé', variant: 'default' });
    } catch {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' });
      loadComments();
    }
  };

  // Long press detection handlers
  const handleTouchStart = (comment: any) => {
    const isOwner = comment.author_id === currentUserId || comment.author_name === currentUserName;
    if (isOwner || isStaff) {
      longPressTimerRef.current = setTimeout(() => {
        setActiveMenuCommentId(comment.id);
        if (navigator.vibrate) navigator.vibrate(50);
      }, 500);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-auto">
      {/* Backdrop sombre */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Tiroir / Sheet Modal */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          backgroundColor: 'rgb(var(--sand))',
          color: 'rgb(var(--cacao))',
          borderColor: 'rgb(var(--cacao) / 0.18)',
        }}
        className="relative z-10 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl border-t sm:border max-h-[85vh] flex flex-col overflow-hidden font-body"
      >
        {/* Grab handle pour la gestuelle de fermeture au glissement vers le bas */}
        <div
          style={{ backgroundColor: 'rgb(var(--cacao) / 0.25)' }}
          className="w-12 h-1.5 rounded-full mx-auto mt-2.5 -mb-1 cursor-grab active:cursor-grabbing shrink-0"
        />

        {/* Header du tiroir */}
        <div
          style={{ borderColor: 'rgb(var(--cacao) / 0.12)' }}
          className="p-4 sm:p-5 border-b flex items-center justify-between gap-3 backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-gold flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-display font-medium text-base sm:text-lg leading-tight text-stone-900 dark:text-sand line-clamp-1">
                Commentaires & Avis
              </h3>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1 font-medium">
                {videoTitle} • {comments.length} message{comments.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bannière si commentaires désactivés */}
        {!commentsEnabled && (
          <div className="px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Les commentaires sont désactivés pour cette vidéo.</span>
          </div>
        )}

        {/* Liste défilante des commentaires */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-[240px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-stone-500 dark:text-stone-400">
              <div className="w-6 h-6 border-2 border-gold/40 border-t-gold rounded-full animate-spin mr-2" />
              <span>Chargement des échanges...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Soyez le premier à commenter !</p>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                Partagez votre ressenti, posez une question sur le soin ou demandez conseil à nos thérapeutes.
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const isCommentStaff = ['admin', 'moderator', 'secretary'].includes(comment.author_role);
              const isOwner = comment.author_id === currentUserId || comment.author_name === currentUserName;
              const isLiked = Array.isArray(comment.liked_by) && comment.liked_by.includes(currentUserId);
              const isEditingThis = editingCommentId === comment.id;
              const isMenuOpen = activeMenuCommentId === comment.id;

              return (
                <div
                  key={comment.id}
                  onTouchStart={() => handleTouchStart(comment)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(comment)}
                  onMouseUp={handleTouchEnd}
                  className={`p-3.5 rounded-2xl transition border select-none relative ${
                    isCommentStaff
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-white dark:bg-stone-900/90 border-stone-200 dark:border-stone-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCommentStaff
                            ? 'bg-amber-500 text-stone-950 font-black'
                            : 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {comment.author_name?.[0]?.toUpperCase() || 'C'}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {comment.author_name}
                          </span>
                          {isCommentStaff && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold inline-flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Équipe BRM</span>
                            </span>
                          )}
                          {isOwner && !isCommentStaff && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold">
                              Vous
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                          {formatTimeAgo(comment.created_at)}
                          {comment.updated_at && ' (modifié)'}
                        </span>
                      </div>
                    </div>

                    {/* Actions : Like, Menu CRUD, Répondre */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Bouton Like */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeComment(comment.id);
                        }}
                        className={`p-1.5 rounded-full flex items-center gap-1 text-[11px] transition active:scale-90 cursor-pointer ${
                          isLiked
                            ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                            : 'text-stone-500 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                        title="Aimer ce commentaire"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        {(comment.likes || 0) > 0 && (
                          <span className="text-[10px] font-bold">{comment.likes}</span>
                        )}
                      </button>

                      {/* Répondre pour Staff */}
                      {isStaff && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyingTo(comment);
                            setInputText(`@${comment.author_name} `);
                          }}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-stone-800 transition text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          title="Répondre au commentaire"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Menu Options (Pour Auteur ou Staff Modérateur/Secrétaire) */}
                      {(isOwner || isStaff) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuCommentId(isMenuOpen ? null : comment.id);
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                          title="Options du commentaire (Appui long)"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Popover / Menu d'options contextuel (Appui Long ou Clic) */}
                  {isMenuOpen && (
                    <div className="my-2 p-2 rounded-xl bg-stone-900 text-stone-100 shadow-xl border border-stone-700 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-stone-400 font-medium pl-1">Actions :</span>
                      <div className="flex items-center gap-1.5">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(comment)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-amber-500/20 text-amber-300 inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Modifier</span>
                          </button>
                        )}
                        {(isOwner || isStaff) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Supprimer</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveMenuCommentId(null)}
                          className="p-1 text-stone-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Référence de réponse */}
                  {comment.reply_author && (
                    <div className="mt-1.5 ml-9 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                      <CornerDownRight className="w-3 h-3 opacity-70" />
                      <span>En réponse à @{comment.reply_author}</span>
                    </div>
                  )}

                  {/* Mode Modification Direct */}
                  {isEditingThis ? (
                    <div className="mt-2 pl-9 space-y-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-stone-950 text-stone-900 dark:text-white border border-amber-500 focus:ring-2 focus:ring-amber-500"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCommentId(null)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(comment.id)}
                          className="btn-gold px-3 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Enregistrer</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Texte du commentaire (Contraste maximal garanti) */
                    <p className="mt-2 text-xs leading-relaxed pl-9 text-stone-900 dark:text-stone-100 font-normal select-text">
                      {comment.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Indicateur si réponse active */}
        {replyingTo && (
          <div className="px-4 py-2 bg-amber-500/15 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-medium">
            <span className="truncate">
              Réponse à <strong className="font-bold">{replyingTo.author_name}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setReplyingTo(null);
                setInputText('');
              }}
              className="text-[11px] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-bold ml-2 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        )}

        {/* Formulaire de saisie d'un nouveau commentaire */}
        {commentsEnabled && (
          <form
            onSubmit={handleSubmit}
            className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#120A06] flex items-center gap-2"
          >
            <input
              type="text"
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isStaff
                  ? 'Répondre officiellement en tant qu\'Équipe BRM...'
                  : 'Écrire un message bienveillant ou poser une question...'
              }
              className="flex-1 py-2.5 px-4 text-xs sm:text-sm rounded-full bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              disabled={submitting}
            />

            <button
              type="submit"
              disabled={submitting || !inputText.trim()}
              className="btn-gold p-2.5 sm:px-4 sm:py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shrink-0 shadow-md disabled:opacity-50 cursor-pointer active:scale-95 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
