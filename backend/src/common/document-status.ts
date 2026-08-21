export function documentStatus(expiresAt: Date | null | undefined, now = new Date()): string {
  if (!expiresAt) return 'valid';
  const days = (expiresAt.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

const SLA_HOURS: Record<string, Record<string, number>> = {
  plumbing: { urgent: 4, high: 24, medium: 72, low: 168 },
  electrical: { urgent: 4, high: 24, medium: 72, low: 168 },
  hvac: { urgent: 8, high: 48, medium: 96, low: 168 },
  structural: { urgent: 8, high: 48, medium: 96, low: 168 },
  cleaning: { urgent: 24, high: 48, medium: 96, low: 168 },
  other: { urgent: 8, high: 24, medium: 72, low: 168 },
};

const DEFAULT_PRIORITY_HOURS: Record<string, number> = {
  urgent: 8,
  high: 24,
  medium: 72,
  low: 168,
};

export function ticketSlaDue(priority: string, opened = new Date(), category = 'other'): Date {
  const byCategory = SLA_HOURS[category.toLowerCase()] ?? DEFAULT_PRIORITY_HOURS;
  const hours = byCategory[priority.toLowerCase()] ?? DEFAULT_PRIORITY_HOURS[priority.toLowerCase()] ?? 168;
  return new Date(opened.getTime() + hours * 3_600_000);
}
