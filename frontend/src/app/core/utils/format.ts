export function truncateText(value: string, max = 48): string {
  const text = value.trim();
  if (max <= 0) return '';
  if (text.length <= max) return text;
  if (max <= 1) return '…';
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function initialsFromName(name: string, maxChars = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .slice(0, Math.max(1, maxChars))
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, Math.max(1, maxChars));
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const diff = now - then;
  if (diff < 0) return 'Just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatNumber(value: number, locale = 'en-GH'): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, digits = 1, locale = 'en-GH'): string {
  if (!Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}%`;
}

export function formatGhs(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function badgeVariantFor(value: string): 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' {
  const key = value.toLowerCase().replace(/[\s-]+/g, '_');
  if (['active', 'paid', 'valid', 'verified', 'resolved', 'closed', 'occupied'].includes(key)) {
    return 'success';
  }
  if (['pending', 'partial', 'assigned', 'expiring', 'ending', 'open', 'vacant'].includes(key)) {
    return 'warning';
  }
  if (['overdue', 'high', 'breached', 'expired', 'in_progress'].includes(key)) {
    return 'danger';
  }
  if (['medium', 'maintenance', 'info'].includes(key)) {
    return 'info';
  }
  if (['owner', 'manager', 'finance'].includes(key)) {
    return 'brand';
  }
  return 'neutral';
}

export function prettyLabel(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDisplayDate(value: string): string {
  const raw = value.trim();
  if (!raw || raw === '—') return '—';

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dateOnly) {
    const date = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const normalised = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsed = new Date(normalised);
  if (!Number.isFinite(parsed.getTime())) return raw;
  const hasClock = /T\d{2}:\d{2}|\d{2}:\d{2}/.test(raw);
  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(hasClock ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
