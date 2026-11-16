import type { LeadOrigin, LeadProfile, LeadScore } from '../types';

export function formatBRL(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Sob consulta';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactBRL(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'R$ 0';
  }
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(2).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`;
  }
  return formatBRL(value);
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

export function captureUtmParams(): {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  inferredOrigin: LeadOrigin;
} {
  if (typeof window === 'undefined') {
    return { utmSource: '', utmMedium: '', utmCampaign: '', inferredOrigin: 'Site' };
  }
  const params = new URLSearchParams(window.location.search);
  const utmSource = (params.get('utm_source') || '').slice(0, 100);
  const utmMedium = (params.get('utm_medium') || '').slice(0, 100);
  const utmCampaign = (params.get('utm_campaign') || '').slice(0, 120);

  const lower = utmSource.toLowerCase();
  let inferredOrigin: LeadOrigin = 'Site';
  if (lower.includes('instagram') || lower.includes('ig')) {
    inferredOrigin = 'Instagram';
  } else if (lower.includes('whatsapp') || lower.includes('wa')) {
    inferredOrigin = 'WhatsApp';
  } else if (
    lower.includes('meta') ||
    lower.includes('facebook') ||
    lower.includes('google') ||
    lower.includes('ads') ||
    utmMedium.toLowerCase().includes('cpc')
  ) {
    inferredOrigin = 'Anuncio';
  }

  return { utmSource, utmMedium, utmCampaign, inferredOrigin };
}

export function calculateLeadScore(input: {
  budget?: number;
  timeframe?: string;
  profile?: LeadProfile;
  email?: string;
  propertyId?: string;
  notes?: string;
}): { score: LeadScore; points: number } {
  let points = 25;
  if (input.budget && input.budget >= 3_000_000) points += 25;
  else if (input.budget && input.budget >= 1_500_000) points += 18;
  else if (input.budget && input.budget > 0) points += 10;

  const tf = (input.timeframe || '').toLowerCase();
  if (tf.includes('imediato') || tf.includes('30 dias') || tf.includes('este mês')) {
    points += 25;
  } else if (tf.includes('3 meses') || tf.includes('6 meses')) {
    points += 15;
  } else if (tf) {
    points += 8;
  }

  if (input.propertyId) points += 12;
  if (input.email && input.email.includes('@')) points += 8;
  if (input.notes && input.notes.trim().length >= 20) points += 5;

  const clamped = Math.min(100, points);
  let score: LeadScore = 'Frio';
  if (clamped >= 70) score = 'Quente';
  else if (clamped >= 45) score = 'Morno';

  return { score, points: clamped };
}

export function formatTimestampDate(value: unknown): string {
  if (!value) return '—';
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR');
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString('pt-BR');
  }
  return '—';
}

export function getTimestampMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function buildWhatsAppUrl(rawPhone?: string, message?: string): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  const encoded = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${full}${encoded}`;
}

export function exportToCsv(
  filename: string,
  rows: Record<string, string | number | boolean>[]
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (val: unknown) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };
  const csv = [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(';')),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
