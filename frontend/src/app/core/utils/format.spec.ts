import {
  formatGhs,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  initialsFromName,
  truncateText,
} from './format';

describe('format', () => {
  it('truncates long text with an ellipsis', () => {
    expect(truncateText('Short')).toBe('Short');
    expect(truncateText('  Hello world from PropFlow  ', 12)).toBe('Hello world…');
    expect(truncateText('Hi', 0)).toBe('');
  });

  it('builds initials from a display name', () => {
    expect(initialsFromName('Ama Owusu')).toBe('AO');
    expect(initialsFromName('Ada')).toBe('A');
    expect(initialsFromName('  ')).toBe('');
    expect(initialsFromName('One Two Three', 3)).toBe('OTT');
  });

  it('formats relative timestamps', () => {
    const now = Date.parse('2026-08-13T12:00:00.000Z');
    expect(formatRelativeTime('2026-08-13T11:59:30.000Z', now)).toBe('Just now');
    expect(formatRelativeTime('2026-08-13T11:45:00.000Z', now)).toBe('15m ago');
    expect(formatRelativeTime('2026-08-13T09:00:00.000Z', now)).toBe('3h ago');
    expect(formatRelativeTime('2026-08-11T12:00:00.000Z', now)).toBe('2d ago');
    expect(formatRelativeTime('not-a-date', now)).toBe('—');
  });

  it('formats numbers, percents, and GHS', () => {
    expect(formatNumber(12400)).toBe('12,400');
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatPercent(99.82)).toBe('99.8%');
    expect(formatPercent(12, 0)).toBe('12%');
    expect(formatGhs(2500)).toContain('2,500');
  });
});
