const eur = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const num = new Intl.NumberFormat('es-ES');

export const formatEUR = (v: number | null | undefined) => (v == null ? '—' : eur.format(v));
export const formatPct = (v: number | null | undefined) => (v == null ? '—' : pct.format(v));
export const formatNum = (v: number | null | undefined) => (v == null ? '—' : num.format(v));

export function formatDateShort(iso: string | Date | null | undefined) {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}
