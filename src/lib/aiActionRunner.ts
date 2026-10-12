import { supabase } from '@/lib/client';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/toaster';

export interface ExecutedActionPayload {
  action_type: 'NONE' | 'BOOK_APPOINTMENT' | 'MANAGE_CART' | 'ALERT_SECRETARY';
  appointment_data?: {
    massage_name?: string;
    date_time_suggestion?: string;
    notes?: string;
  };
  cart_data?: {
    product_id?: string;
    product_name?: string;
    quantity?: number;
    discount_percent?: number;
  };
  secretary_alert?: {
    subject?: string;
    urgency?: string;
    notes?: string;
  };
}

export interface ActionResult {
  success: boolean;
  type: string;
  summary: string;
  data?: any;
}

/**
 * Exécute de manière sécurisée et dynamique les actions décidées par le Conseiller IA
 */
export async function executeAiAction(
  action: ExecutedActionPayload,
  context: {
    clientKey?: string;
    clientName?: string;
    clientPhone?: string;
    maxDiscountCap?: number;
    cart: {
      addItemWithDiscount: (p: any) => void;
      add: (p: any) => void;
    };
    onOpenCart?: () => void;
  }
): Promise<ActionResult | null> {
  if (!action || !action.action_type || action.action_type === 'NONE') {
    return null;
  }

  const { clientKey, clientName, clientPhone, maxDiscountCap = 15, cart, onOpenCart } = context;

  // 1. ACTION: PRISE DE RENDEZ-VOUS EN DIRECT
  if (action.action_type === 'BOOK_APPOINTMENT') {
    const massageName = action.appointment_data?.massage_name || 'Réflexologie Plantaire Thérapeutique';
    const dateSuggestion = action.appointment_data?.date_time_suggestion || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const notes = action.appointment_data?.notes || 'Réservation initiée via Conseiller IA';

    const newAppointment = {
      client_key: clientKey || 'guest',
      client_name: clientName || 'Client Conseiller IA',
      client_phone: clientPhone || '',
      massage_name: massageName,
      date: dateSuggestion.includes('T') ? dateSuggestion : `${dateSuggestion}T10:00:00.000Z`,
      status: 'pending',
      notes: `[Action IA]: ${notes}`,
      payment_status: 'unpaid',
      created_date: new Date().toISOString(),
    };

    try {
      if (supabase) {
        await supabase.from('appointments').insert(newAppointment);
      }
      await base44.entities.Appointment.create(newAppointment);

      toast({
        title: 'Séance pré-réservée avec succès !',
        description: `${massageName} • Notre secrétariat confirme votre créneau sous peu.`,
        variant: 'success',
      });

      return {
        success: true,
        type: 'BOOK_APPOINTMENT',
        summary: `Rendez-vous pour ${massageName} enregistré.`,
        data: newAppointment,
      };
    } catch (err: any) {
      console.warn('[executeAiAction] Erreur réservation :', err);
      return {
        success: false,
        type: 'BOOK_APPOINTMENT',
        summary: 'Échec de l\'enregistrement automatique du rendez-vous.',
      };
    }
  }

  // 2. ACTION: AJOUT AU PANIER AVEC NÉGOCIATION DE REMISE CÔTÉ COCKPIT
  if (action.action_type === 'MANAGE_CART') {
    const pName = action.cart_data?.product_name || 'Huile Thérapeutique d\'Arnica';
    const pId = action.cart_data?.product_id || `prod_${Date.now()}`;
    const qty = Math.max(1, Number(action.cart_data?.quantity || 1));
    
    // Plafond strict contrôlé par le cockpit modérateur
    const rawDiscount = Number(action.cart_data?.discount_percent || 0);
    const safeDiscount = Math.min(Math.max(0, rawDiscount), maxDiscountCap);

    const basePrice = 8500;
    const finalPrice = safeDiscount > 0 ? Math.round(basePrice * (1 - safeDiscount / 100)) : basePrice;

    cart.addItemWithDiscount({
      id: pId,
      name: pName,
      price: finalPrice,
      original_price: safeDiscount > 0 ? basePrice : undefined,
      discount_percent: safeDiscount > 0 ? safeDiscount : undefined,
      qty,
    });

    toast({
      title: 'Produit ajouté au panier !',
      description: safeDiscount > 0
        ? `${pName} ajouté avec ${safeDiscount}% de remise exclusive négociée par Awa !`
        : `${pName} (${qty}x) a été ajouté à votre panier.`,
      variant: 'success',
    });

    if (onOpenCart) {
      setTimeout(() => onOpenCart(), 600);
    }

    return {
      success: true,
      type: 'MANAGE_CART',
      summary: `${pName} ajouté au panier (${safeDiscount > 0 ? `-${safeDiscount}%` : 'Prix standard'}).`,
      data: { pName, finalPrice, safeDiscount, qty },
    };
  }

  // 3. ACTION: ALERTE SECRÉTARIAT / CAS URGENT
  if (action.action_type === 'ALERT_SECRETARY') {
    const alertSubject = action.secretary_alert?.subject || 'Signalement cas d\'écoute prioritaire';
    const alertNotes = action.secretary_alert?.notes || 'Le client a formulé une douleur aiguë ou demande une intervention humaine.';

    const messageData = {
      client_key: clientKey || 'guest',
      sender: 'client',
      text: `🚨 [ALERTE PRIORITAIRE CONSEILLER IA] : ${alertSubject}\n${alertNotes}`,
      read: false,
      flag: 'urgent',
      created_date: new Date().toISOString(),
    };

    try {
      if (supabase) {
        await supabase.from('chat_messages').insert(messageData);
      }
      await base44.entities.Message.create(messageData);

      toast({
        title: 'Alerte transmise au secrétariat',
        description: 'Un conseiller humain a été notifié de votre situation.',
        variant: 'default',
      });

      return {
        success: true,
        type: 'ALERT_SECRETARY',
        summary: 'Secrétariat prévenu en priorité.',
        data: messageData,
      };
    } catch (err) {
      console.warn('[executeAiAction] Erreur alerte secrétariat :', err);
      return {
        success: false,
        type: 'ALERT_SECRETARY',
        summary: 'Impossible de notifier le secrétariat.',
      };
    }
  }

  return null;
}
