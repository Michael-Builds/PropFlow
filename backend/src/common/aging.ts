export function arrearsBucket(dueDate: Date, now = new Date()): string {
  const days = Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000);
  if (days < 0) return 'current';
  if (days <= 30) return '1-30 days';
  if (days <= 60) return '31-60 days';
  if (days <= 90) return '61-90 days';
  return '90+ days';
}

export function formatGhs(amount: number): string {
  return `GHS ${amount.toLocaleString('en-GH', { maximumFractionDigits: 2 })}`;
}
