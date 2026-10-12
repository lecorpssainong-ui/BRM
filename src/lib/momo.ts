const onlyDigits = (value: any): string => String(value || '').replace(/\D/g, '');

export function momoUssdLink(number: string | undefined | null, amount?: number | string | null): string {
  const merchant = onlyDigits(number);
  if (!merchant) return '';
  const montant = Math.round(Number(amount) || 0);
  return montant > 0
    ? `tel:*880*46*${merchant}*${montant}%23`
    : `tel:*880*46*${merchant}%23`;
}

export function dialMomo(number: string | undefined | null, amount?: number | string | null): string {
  const link = momoUssdLink(number, amount);
  if (link && typeof window !== 'undefined') {
    window.location.href = link;
  }
  return link;
}
