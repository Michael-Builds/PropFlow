import {
  DocumentStatus,
  InvoiceStatus,
  KycStatus,
  LeaseStatus,
  RecordStatus,
  TicketPriority,
  TicketStatus,
  UnitStatus,
} from '../enums/domain.enum';
import { UserRole } from '../enums/user-role.enum';
import { BadgeVariant } from '../interfaces/badge.interface';

const SUCCESS_STATUSES = new Set<string>([
  RecordStatus.Active,
  InvoiceStatus.Paid,
  DocumentStatus.Valid,
  KycStatus.Verified,
  TicketStatus.Resolved,
  TicketStatus.Closed,
  UnitStatus.Occupied,
  'complete',
]);

const WARNING_STATUSES = new Set<string>([
  KycStatus.Pending,
  InvoiceStatus.Partial,
  TicketStatus.Assigned,
  DocumentStatus.Expiring,
  LeaseStatus.Ending,
  TicketStatus.Open,
  UnitStatus.Vacant,
  'pending',
]);

const DANGER_STATUSES = new Set<string>([
  InvoiceStatus.Overdue,
  TicketPriority.High,
  DocumentStatus.Expired,
  TicketStatus.InProgress,
  'breached',
]);

const INFO_STATUSES = new Set<string>([TicketPriority.Medium, UnitStatus.Maintenance, 'info']);

const BRAND_ROLES = new Set<string>([UserRole.Owner, UserRole.Manager, UserRole.Finance]);

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

export function badgeVariantFor(value: string): BadgeVariant {
  const key = value.toLowerCase().replace(/[\s-]+/g, '_');
  if (SUCCESS_STATUSES.has(key) || SUCCESS_STATUSES.has(value)) return 'success';
  if (WARNING_STATUSES.has(key) || WARNING_STATUSES.has(value)) return 'warning';
  if (DANGER_STATUSES.has(key) || DANGER_STATUSES.has(value)) return 'danger';
  if (INFO_STATUSES.has(key) || INFO_STATUSES.has(value)) return 'info';
  if (BRAND_ROLES.has(key) || BRAND_ROLES.has(value)) return 'brand';
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
