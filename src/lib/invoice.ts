import { jsPDF } from 'jspdf';
import { formatPrice, formatDate } from './format';

export const round = (n: number | string | undefined | null) => Math.round(Number(n) || 0);

export function lineDiscount(qty: number | string, massage?: any): number {
  const min = Number(massage?.bulk_min_qty) > 0 ? Number(massage.bulk_min_qty) : 10;
  const pct = Number(massage?.bulk_discount_percent) || 0;
  return Number(qty) >= min ? pct : 0;
}

export function computeLine(qty: number | string, unitPrice: number | string, massage?: any) {
  const q = Math.max(0, Number(qty) || 0);
  const p = Math.max(0, Number(unitPrice) || 0);
  const pct = lineDiscount(q, massage);
  const gross = q * p;
  return {
    qty: q,
    unit_price: p,
    discount_percent: pct,
    total: round(gross * (1 - pct / 100)),
  };
}

export function invoiceTotals(items: any[] = []) {
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const total = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
  return {
    subtotal: round(subtotal),
    discount: round(subtotal - total),
    total: round(total),
  };
}

export function countSessions(invoices: any[] = []): number {
  return invoices
    .filter((i) => i.status !== 'cancelled')
    .reduce(
      (sum, i) =>
        sum + (i.items || []).reduce((s: number, it: any) => s + (Number(it.qty) || 0), 0),
      0
    );
}

export function loyaltyState(invoices: any[] = [], threshold = 11) {
  const total = countSessions(invoices);
  const step = Math.max(2, Number(threshold) || 11);
  const done = total % step;
  return {
    total,
    step,
    done,
    remaining: step - done,
    isDue: done === step - 1,
  };
}

export function invoiceWhatsappText(invoice: any, settings: any = {}) {
  const date = formatDate(invoice.date || invoice.created_date, "d MMMM yyyy");
  const items = (invoice.items || [])
    .map(
      (it: any) =>
        `• ${it.label || it.name} ×${it.qty} — ${formatPrice(it.total)}`
    )
    .join('\n');
  return encodeURIComponent(
    `Bonjour ${settings.center_name || 'Bénin Réflexologie Massage'}, voici ma facture N° ${
      invoice.number || '001'
    } du ${date}.\n${items}\nTotal : ${formatPrice(invoice.total)}`
  );
}

function hexToRgb(hex: string, fallback = [184, 134, 75]): [number, number, number] {
  if (!hex || typeof hex !== 'string') return fallback as [number, number, number];
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  }
  return fallback as [number, number, number];
}

async function loadDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function invoicePdf(invoice: any, settings: any = {}): Promise<void> {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const M = 46; // margin
  const contentWidth = pageWidth - M * 2;

  const accentColor = hexToRgb(settings.invoice_accent || '#b8864b');
  const cacaoColor: [number, number, number] = [42, 28, 21];

  // Optional background image watermark
  if (settings.invoice_bg_url && settings.invoice_bg_opacity) {
    const bgData = await loadDataUrl(settings.invoice_bg_url);
    if (bgData) {
      try {
        const opacity = Math.min(0.9, Math.max(0.02, (Number(settings.invoice_bg_opacity) || 10) / 100));
        (doc as any).saveGraphicsState?.();
        (doc as any).setGState?.(new (doc as any).GState({ opacity }));
        doc.addImage(bgData, 'JPEG', 0, 0, pageWidth, pageHeight);
        (doc as any).restoreGraphicsState?.();
      } catch {
        // continue without watermark if unsupported
      }
    }
  }

  // Header band
  doc.setFillColor(...cacaoColor);
  doc.rect(0, 0, pageWidth, 108, 'F');

  // Accent stripe
  doc.setFillColor(...accentColor);
  doc.rect(0, 105, pageWidth, 3, 'F');

  // Center Name & coordinates
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings.center_name || 'Bénin Réflexologie Massage', M, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(245, 238, 230);
  let headerY = 54;

  if (settings.invoice_show_address !== false && (settings.address || settings.center_landmark)) {
    const addr = [settings.address, settings.center_landmark, settings.center_city].filter(Boolean).join(' • ');
    doc.text(addr, M, headerY);
    headerY += 13;
  }
  if (settings.invoice_show_contact !== false && (settings.center_phone || settings.center_email)) {
    const contact = [settings.center_phone, settings.whatsapp, settings.center_email].filter(Boolean).join(' • ');
    doc.text(contact, M, headerY);
    headerY += 13;
  }
  if (settings.invoice_show_hours !== false && settings.opening_hours) {
    doc.text(settings.opening_hours, M, headerY);
  }

  // Logo if enabled
  if (settings.invoice_show_logo !== false && (settings.invoice_logo_url || settings.logo_url)) {
    const logoUrl = settings.invoice_logo_url || settings.logo_url;
    const logoData = await loadDataUrl(logoUrl);
    if (logoData) {
      try {
        doc.addImage(logoData, 'JPEG', pageWidth - M - 62, 23, 62, 62);
      } catch {
        // continue
      }
    }
  }

  // Client section & Invoice Meta
  let y = 145;
  doc.setTextColor(...cacaoColor);

  // Left: Client info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentColor);
  doc.text('CLIENT', M, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...cacaoColor);
  doc.text(invoice.client_name || 'Client', M, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 80, 75);
  let clientY = y + 30;
  if (invoice.client_phone) {
    doc.text(`Tél : ${invoice.client_phone}`, M, clientY);
    clientY += 13;
  }
  if (invoice.client_address) {
    doc.text(`Adresse : ${invoice.client_address}`, M, clientY);
  }

  // Right: Invoice Meta
  const rightX = pageWidth - M;
  const title = settings.invoice_title || 'FACTURE';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...cacaoColor);
  doc.text(title, rightX, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 80, 75);
  const invoiceNum = invoice.number ? `N° ${invoice.number}` : 'N° BRM-001';
  doc.text(invoiceNum, rightX, y + 15, { align: 'right' });

  const dateStr = invoice.date ? formatDate(invoice.date, "d MMMM yyyy") : formatDate(new Date(), "d MMMM yyyy");
  doc.text(`Date : ${dateStr}`, rightX, y + 28, { align: 'right' });

  if (settings.invoice_show_issued_by !== false && invoice.issued_by) {
    doc.text(`Émise par : ${invoice.issued_by}`, rightX, y + 41, { align: 'right' });
  }

  // Separator rule
  y = Math.max(clientY, y + 50) + 18;
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(1);
  doc.line(M, y, pageWidth - M, y);

  // Table Columns
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...cacaoColor);

  doc.text('PRESTATION', M, y);
  doc.text('QTÉ', pageWidth - M - 200, y, { align: 'center' });
  doc.text('P.U.', pageWidth - M - 140, y, { align: 'right' });
  if (settings.invoice_show_discounts !== false) {
    doc.text('REMISE', pageWidth - M - 75, y, { align: 'right' });
  }
  doc.text('TOTAL', pageWidth - M, y, { align: 'right' });

  // Items rows
  y += 10;
  const items = invoice.items || [];
  doc.setFont('helvetica', 'normal');

  for (const item of items) {
    y += 18;
    // Automatic page break if approaching bottom
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 50;
    }

    const label = String(item.label || item.name || '').substring(0, 44);
    const qty = Number(item.qty || 1);
    const pu = Number(item.unit_price || item.price || 0);
    const discount = Number(item.discount_percent || 0);
    const lineTotal = Number(item.total || qty * pu);

    doc.setFontSize(9);
    doc.setTextColor(...cacaoColor);
    doc.text(label, M, y);
    doc.text(String(qty), pageWidth - M - 200, y, { align: 'center' });
    doc.text(formatPrice(pu), pageWidth - M - 140, y, { align: 'right' });

    if (settings.invoice_show_discounts !== false) {
      const discountText = discount > 0 ? `-${discount}%` : '—';
      doc.setTextColor(discount > 0 ? accentColor[0] : 120, discount > 0 ? accentColor[1] : 120, discount > 0 ? accentColor[2] : 120);
      doc.text(discountText, pageWidth - M - 75, y, { align: 'right' });
    }

    doc.setTextColor(...cacaoColor);
    doc.text(formatPrice(lineTotal), pageWidth - M, y, { align: 'right' });

    // Underline
    doc.setDrawColor(235, 224, 224);
    doc.setLineWidth(0.5);
    doc.line(M, y + 6, pageWidth - M, y + 6);
  }

  // Totals Section
  y += 28;
  const totals = invoiceTotals(items);
  const totalDue = invoice.total !== undefined ? Number(invoice.total) : totals.total;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 80, 75);

  doc.text('Sous-total :', pageWidth - M - 175, y);
  doc.text(formatPrice(totals.subtotal), pageWidth - M, y, { align: 'right' });

  if (settings.invoice_show_discounts !== false && totals.discount > 0) {
    y += 15;
    doc.setTextColor(...accentColor);
    doc.text('Remises appliquées :', pageWidth - M - 175, y);
    doc.text(`-${formatPrice(totals.discount)}`, pageWidth - M, y, { align: 'right' });
  }

  if (invoice.loyalty_applied) {
    y += 15;
    doc.setTextColor(86, 100, 74);
    doc.text('Avantage fidélité :', pageWidth - M - 175, y);
    doc.text('Appliqué', pageWidth - M, y, { align: 'right' });
  }

  // Grand Total Box
  y += 20;
  const boxW = 180;
  const boxH = 34;
  const boxX = pageWidth - M - boxW;
  doc.setFillColor(...cacaoColor);
  doc.roundedRect(boxX, y, boxW, boxH, 4, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL :', boxX + 12, y + 21);
  doc.setFontSize(12);
  doc.text(formatPrice(totalDue), boxX + boxW - 12, y + 22, { align: 'right' });

  y += boxH + 25;

  // Next appointment note
  if (settings.invoice_show_next !== false && (invoice.next_appointment || invoice.next_massage)) {
    doc.setFillColor(245, 238, 230);
    doc.roundedRect(M, y, contentWidth, 34, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...accentColor);
    doc.text('PROCHAIN RENDEZ-VOUS', M + 12, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...cacaoColor);
    const nextInfo = [
      invoice.next_massage,
      invoice.next_appointment ? formatDate(invoice.next_appointment) : null
    ].filter(Boolean).join(' — ');
    doc.text(nextInfo, M + 12, y + 26);
    y += 44;
  }

  // Notes
  if (settings.invoice_show_notes !== false && invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...accentColor);
    doc.text('NOTES', M, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 80, 75);
    const splitNotes = doc.splitTextToSize(String(invoice.notes), contentWidth);
    doc.text(splitNotes.slice(0, 5), M, y + 12);
  }

  // Footer
  const footerY = pageHeight - 44;
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(1);
  doc.line(M, footerY - 14, pageWidth - M, footerY - 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...cacaoColor);
  const footerText = settings.invoice_footer || 'Merci de votre confiance — prenez soin de vous.';
  doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });

  if (settings.invoice_note) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 130, 125);
    doc.text(settings.invoice_note, pageWidth / 2, footerY + 12, { align: 'center' });
  }

  const filename = `facture-${invoice.number || invoice.id || 'centre'}.pdf`;
  doc.save(filename);
}

export async function generateInvoicePdfBlob(invoice: any, settings: any = {}): Promise<Blob> {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const M = 46; // margin
  const contentWidth = pageWidth - M * 2;

  const accentColor = hexToRgb(settings.invoice_accent || '#b8864b');
  const cacaoColor: [number, number, number] = [42, 28, 21];

  // Optional background image watermark
  if (settings.invoice_bg_url && settings.invoice_bg_opacity) {
    const bgData = await loadDataUrl(settings.invoice_bg_url);
    if (bgData) {
      try {
        const opacity = Math.min(0.9, Math.max(0.02, (Number(settings.invoice_bg_opacity) || 10) / 100));
        (doc as any).saveGraphicsState?.();
        (doc as any).setGState?.(new (doc as any).GState({ opacity }));
        doc.addImage(bgData, 'JPEG', 0, 0, pageWidth, pageHeight);
        (doc as any).restoreGraphicsState?.();
      } catch {
        // continue without watermark if unsupported
      }
    }
  }

  // Header band
  doc.setFillColor(...cacaoColor);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Center Name
  doc.setFont('times', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(245, 238, 230);
  doc.text(settings.center_name || 'BÉNIN RÉFLEXOLOGIE MASSAGE', M, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(215, 195, 175);
  const subtitle = [
    settings.address || 'Cotonou, Bénin',
    settings.center_phone || '+229 97 00 00 00',
    settings.center_email || 'contact@benin-reflexologie.bj',
  ].filter(Boolean).join(' • ');
  doc.text(subtitle, M, 58);

  // Big Invoice Title
  let y = 120;
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...cacaoColor);
  doc.text('FACTURE OFFICIELLE', M, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...accentColor);
  doc.text(`N° ${invoice.number || '001'}`, pageWidth - M, y, { align: 'right' });

  // Status badge
  const isPaid = invoice.status === 'paid';
  doc.setFontSize(8.5);
  if (isPaid) {
    doc.setTextColor(40, 120, 60);
    doc.text('ACQUITTÉE', pageWidth - M, y + 16, { align: 'right' });
  } else {
    doc.setTextColor(180, 80, 40);
    doc.text('ÉMISE — EN ATTENTE', pageWidth - M, y + 16, { align: 'right' });
  }

  y += 35;
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(1);
  doc.line(M, y, pageWidth - M, y);
  y += 24;

  // Metadata block (2 columns)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...accentColor);
  doc.text('FACTURÉ À :', M, y);
  doc.text('DÉTAILS DU RÈGLEMENT :', pageWidth / 2 + 10, y);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 50, 45);

  doc.text(invoice.client_name || 'Client', M, y);
  doc.text(`Date d'émission : ${formatDate(invoice.date || invoice.created_date, 'd MMMM yyyy')}`, pageWidth / 2 + 10, y);

  y += 13;
  if (invoice.client_phone) {
    doc.text(`Tél : ${invoice.client_phone}`, M, y);
  }
  if (invoice.issued_by) {
    doc.text(`Émis par : ${invoice.issued_by}`, pageWidth / 2 + 10, y);
  }

  y += 13;
  if (invoice.client_address) {
    doc.text(invoice.client_address, M, y);
  }
  if (invoice.payment_method) {
    doc.text(`Mode de paiement : ${invoice.payment_method.toUpperCase()}`, pageWidth / 2 + 10, y);
  }

  y += 28;

  // Items table
  const colW = {
    desc: contentWidth - 190,
    qty: 45,
    unit: 70,
    total: 75,
  };

  doc.setFillColor(245, 238, 230);
  doc.rect(M, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...cacaoColor);
  doc.text('DESCRIPTION DU SOIN', M + 8, y + 14);
  doc.text('QTÉ', M + colW.desc + 6, y + 14);
  doc.text('P.U. (FCFA)', M + colW.desc + colW.qty + 6, y + 14);
  doc.text('TOTAL', pageWidth - M - 8, y + 14, { align: 'right' });

  y += 26;

  // Table Rows
  const items = invoice.items || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const it of items) {
    doc.setTextColor(40, 30, 25);
    const desc = it.label || it.name || 'Soin';
    doc.text(desc, M + 8, y + 10);
    doc.text(String(it.qty || 1), M + colW.desc + 12, y + 10);
    doc.text(formatPrice(it.unit_price || it.price || 0), M + colW.desc + colW.qty + 6, y + 10);
    doc.text(formatPrice(it.total || 0), pageWidth - M - 8, y + 10, { align: 'right' });

    y += 18;
    doc.setDrawColor(230, 220, 210);
    doc.setLineWidth(0.5);
    doc.line(M, y, pageWidth - M, y);
    y += 8;
  }

  y += 12;

  // Totals Section
  const totals = invoiceTotals(items);
  const totalDue = invoice.total ?? totals.total;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 70, 65);
  doc.text('Sous-total brut :', pageWidth - M - 175, y);
  doc.text(formatPrice(totals.subtotal), pageWidth - M, y, { align: 'right' });

  if (settings.invoice_show_discounts !== false && totals.discount > 0) {
    y += 15;
    doc.setTextColor(...accentColor);
    doc.text('Remises appliquées :', pageWidth - M - 175, y);
    doc.text(`-${formatPrice(totals.discount)}`, pageWidth - M, y, { align: 'right' });
  }

  // Grand Total Box
  y += 20;
  const boxW = 180;
  const boxH = 34;
  const boxX = pageWidth - M - boxW;
  doc.setFillColor(...cacaoColor);
  doc.roundedRect(boxX, y, boxW, boxH, 4, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL :', boxX + 12, y + 21);
  doc.setFontSize(12);
  doc.text(formatPrice(totalDue), boxX + boxW - 12, y + 22, { align: 'right' });

  // Footer
  const footerY = pageHeight - 44;
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(1);
  doc.line(M, footerY - 14, pageWidth - M, footerY - 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...cacaoColor);
  const footerText = settings.invoice_footer || 'Merci de votre confiance — prenez soin de vous.';
  doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });

  return doc.output('blob');
}
