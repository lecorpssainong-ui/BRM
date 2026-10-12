import { jsPDF } from 'jspdf';

/**
 * GÉNÉRATEUR DE BILAN DE SANTÉ CLINIQUE PDF LUXUEUX
 * Édition haute fidélité pour Bénin Réflexologie Massage
 * 
 * @param {object} anamnesisData - Données complètes de l'anamnèse
 * @returns {jsPDF} instance jsPDF avec méthodes .save() et .output()
 */
export function generateLuxuryAnamnesisPdf(anamnesisData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Couleurs de la charte Bénin Réflexologie
  const colorGold = [184, 134, 75]; // #b8864b
  const colorCacao = [43, 29, 22]; // #2b1d16
  const colorSand = [245, 239, 230]; // #f5efe6
  const colorDark = [26, 17, 11]; // #1a110b

  // 1. FOND DE PAGE & CADRE ÉLÉGANT
  doc.setFillColor(252, 250, 247);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Bordure dorée raffinée
  doc.setDrawColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setLineWidth(0.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // 2. EN-TÊTE DU DOCUMENT (HEADER LUXE)
  doc.setFillColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.rect(10, 10, pageWidth - 20, 36, 'F');

  // Titre du Centre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(245, 239, 230);
  doc.text('BÉNIN RÉFLEXOLOGIE MASSAGE', pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.text('SANCTUAIRE DE BIEN-ÊTRE & RÉGÉNÉRATION HOLISTIQUE • COTONOU', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(190, 180, 170);
  doc.text('Rue 340, Haie Vive • Tél : +229 97 00 00 00 • contact@benin-reflexologie.bj', pageWidth / 2, 34, { align: 'center' });

  doc.setDrawColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.setLineWidth(0.5);
  doc.line(10, 46, pageWidth - 10, 46);

  // 3. BANDEAU TITRE DU BILAN
  let currentY = 56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colorCacao[0], colorCacao[1], colorCacao[2]);
  doc.text('BILAN CLINIQUE DE VITALITÉ & ANAMNÈSE', 18, currentY);

  const reference = anamnesisData.reference || `BRM-ANAM-${Date.now().toString().slice(-6)}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.text(`RÉF : ${reference}`, pageWidth - 18, currentY, { align: 'right' });

  currentY += 8;

  // 4. INFORMATIONS PATIENT / CLIENT (ENCADRÉ SAND)
  doc.setFillColor(colorSand[0], colorSand[1], colorSand[2]);
  doc.roundedRect(16, currentY, pageWidth - 32, 24, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorCacao[0], colorCacao[1], colorCacao[2]);
  doc.text('PATIENT(E) :', 22, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(anamnesisData.client_name || 'Inès Lawson', 52, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('TÉLÉPHONE :', 22, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(anamnesisData.client_phone || '+229 97 00 00 00', 52, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE DU BILAN :', 120, currentY + 7);
  doc.setFont('helvetica', 'normal');
  const dateStr = anamnesisData.created_at
    ? new Date(anamnesisData.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('fr-FR');
  doc.text(dateStr, 155, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUT :', 120, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34); // Forest Green
  doc.text('VALIDÉ EN CENTRE', 155, currentY + 14);

  currentY += 32;

  // 5. PATHOLOGIE MAJEURE & INTENSITÉ DE LA GÊNE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorCacao[0], colorCacao[1], colorCacao[2]);
  doc.text('1. PATHOLOGIE DIAGNOSTIQUÉE & INTENSITÉ', 18, currentY);

  currentY += 6;
  doc.setDrawColor(220, 210, 200);
  doc.line(18, currentY, pageWidth - 18, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text('Pathologie Principale :', 20, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.text(anamnesisData.pathology || 'Stress & Tensions Musculaires Aiguës', 68, currentY);

  currentY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text('Intensité des Douleurs :', 20, currentY);

  const intensity = Number(anamnesisData.intensity ?? 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(intensity >= 7 ? 200 : 40, intensity >= 7 ? 40 : 150, 40);
  doc.text(`${intensity} / 10 (${intensity >= 7 ? 'ÉLEVÉE' : intensity >= 4 ? 'MODÉRÉE' : 'LÉGÈRE'})`, 68, currentY);

  // Barre visuelle de jauge d'intensité
  doc.setFillColor(230, 225, 220);
  doc.rect(130, currentY - 4, 50, 5, 'F');
  const barWidth = Math.min(50, Math.max(5, (intensity / 10) * 50));
  doc.setFillColor(intensity >= 7 ? 210 : colorGold[0], intensity >= 7 ? 50 : colorGold[1], intensity >= 7 ? 50 : colorGold[2]);
  doc.rect(130, currentY - 4, barWidth, 5, 'F');

  currentY += 14;

  // 6. ZONES CORPORELLES & POINTS RÉFLEXES DOULOUREUX
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorCacao[0], colorCacao[1], colorCacao[2]);
  doc.text('2. CARTOGRAPHIE CORPORELLE & ZONES DE TENSION', 18, currentY);

  currentY += 6;
  doc.setDrawColor(220, 210, 200);
  doc.line(18, currentY, pageWidth - 18, currentY);

  currentY += 8;
  const painZones =
    Array.isArray(anamnesisData.pain_zones) && anamnesisData.pain_zones.length > 0
      ? anamnesisData.pain_zones
      : ['Voûte plantaire', 'Trapèzes & Nuque', 'Lombaires (bas du dos)'];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);

  painZones.forEach((zone) => {
    doc.setFillColor(colorGold[0], colorGold[1], colorGold[2]);
    doc.circle(22, currentY - 1.2, 1.5, 'F');
    doc.text(zone, 27, currentY);
    currentY += 6;
  });

  currentY += 6;

  // 7. SYMPTÔMES & MANIFESTATIONS CLINIQUES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colorCacao[0], colorCacao[1], colorCacao[2]);
  doc.text('3. SYMPTÔMES & PRÉCAUTIONS MÉDICALES', 18, currentY);

  currentY += 6;
  doc.setDrawColor(220, 210, 200);
  doc.line(18, currentY, pageWidth - 18, currentY);

  currentY += 8;
  const symptoms =
    Array.isArray(anamnesisData.symptoms) && anamnesisData.symptoms.length > 0
      ? anamnesisData.symptoms
      : ['Fatigue nerveuse en fin de journée', 'Sommeil perturbé', 'Raideurs musculaires matinales'];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  symptoms.forEach((symp) => {
    doc.text(`•  ${symp}`, 20, currentY);
    currentY += 6;
  });

  if (anamnesisData.precautions) {
    currentY += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Précautions signalées : ', 20, currentY);
    doc.setFont('helvetica', 'italic');
    doc.text(anamnesisData.precautions, 60, currentY);
    currentY += 6;
  }

  currentY += 8;

  // 8. SOIN RECOMMANDÉ & PROTOCOLE THÉRAPEUTIQUE
  doc.setFillColor(250, 245, 238);
  doc.setDrawColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(16, currentY, pageWidth - 32, 28, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.text('PROTOCOLE RECOMMANDÉ PAR LE CENTRE :', 22, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colorCacao[0], colorCacao[1], colorCacao[2]);
  doc.text(anamnesisData.recommended_care || 'Réflexologie Plantaire Thérapeutique (60 min)', 22, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text('Objectif : Libération des nœuds réflexes, relance de la circulation et apaisement neuro-végétatif.', 22, currentY + 22);

  currentY += 36;

  // 9. SIGNATURE NUMÉRIQUE & PIED DE PAGE
  const footerY = pageHeight - 34;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 130, 120);
  doc.text('Certifié conforme aux constatations cliniques établies lors de la consultation.', 18, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.text('Bénin Réflexologie Massage — Direction Thérapeutique', pageWidth - 18, footerY, { align: 'right' });

  doc.setDrawColor(colorGold[0], colorGold[1], colorGold[2]);
  doc.setLineWidth(0.4);
  doc.line(18, footerY + 4, pageWidth - 18, footerY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 140, 130);
  doc.text('Document confidentiel édité par Bénin Réflexologie Massage. Ne se substitue pas à une ordonnance médicale.', pageWidth / 2, footerY + 10, { align: 'center' });

  return doc;
}
