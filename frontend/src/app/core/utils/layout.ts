import { BreakpointName } from './breakpoints';

export function oddLastGridClass(
  index: number,
  total: number,
  resetAt: Extract<BreakpointName, 'sm' | 'md' | 'lg' | 'xl'> = 'lg',
): string {
  if (total <= 0 || index < 0 || index !== total - 1) return '';
  if (total % 2 === 0) return '';
  return `col-span-2 ${resetAt}:col-span-1`;
}

export function isOddLastItem(index: number, total: number): boolean {
  return total > 0 && total % 2 === 1 && index === total - 1;
}
