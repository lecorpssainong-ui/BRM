import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatPrice = (n: number | string | undefined | null) =>
  `${Math.round(Number(n || 0)).toLocaleString('fr-FR')} FCFA`;

export const formatDate = (d: string | number | Date | undefined | null, pattern = "EEEE d MMMM 'à' HH'h'mm") => {
  if (!d) return '';
  try {
    return format(new Date(d), pattern, { locale: fr });
  } catch {
    return String(d);
  }
};

export const formatTimeAgo = (d: string | number | Date | undefined | null) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "À l'instant";
    if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)} h`;
    if (diffSec < 604800) return `Il y a ${Math.floor(diffSec / 86400)} j`;
    return format(date, 'd MMM yyyy', { locale: fr });
  } catch {
    return '';
  }
};

export const APPT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'En attente',   cls: 'bg-amber-100 text-amber-800' },
  accepted:  { label: 'Confirmé',     cls: 'bg-emerald-100 text-emerald-800' },
  confirmed: { label: 'Confirmé',     cls: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Terminé',      cls: 'bg-stone-200 text-stone-700' },
  modified:  { label: 'Reprogrammé',  cls: 'bg-sky-100 text-sky-800' },
  refused:   { label: 'Annulé',       cls: 'bg-rose-100 text-rose-700' },
  cancelled: { label: 'Annulé',       cls: 'bg-rose-100 text-rose-700' },
};

export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Paiement à vérifier', cls: 'bg-amber-100 text-amber-800' },
  paid:      { label: 'Payée',               cls: 'bg-emerald-100 text-emerald-800' },
  delivered: { label: 'Livrée',              cls: 'bg-sky-100 text-sky-800' },
  cancelled: { label: 'Annulée',             cls: 'bg-rose-100 text-rose-700' },
};
