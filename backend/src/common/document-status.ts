export function documentStatus(expiresAt: Date | null | undefined, now = new Date()): string {
  if (!expiresAt) return 'valid';
  const days = (expiresAt.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

export function ticketSlaDue(priority: string, opened = new Date()): Date {
  const hours = priority === 'high' ? 24 : priority === 'medium' ? 72 : 168;
  return new Date(opened.getTime() + hours * 3_600_000);
}
