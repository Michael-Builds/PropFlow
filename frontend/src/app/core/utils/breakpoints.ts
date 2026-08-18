export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

export type DeviceKind = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export function minWidthQuery(breakpoint: BreakpointName): string {
  return `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
}

export function maxWidthQuery(breakpoint: BreakpointName): string {
  return `(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`;
}

export function isMinWidth(width: number, breakpoint: BreakpointName): boolean {
  return width >= BREAKPOINTS[breakpoint];
}

export function isMaxWidth(width: number, breakpoint: BreakpointName): boolean {
  return width < BREAKPOINTS[breakpoint];
}

export function resolveDeviceKind(width: number): DeviceKind {
  if (!Number.isFinite(width) || width < 0) return 'mobile';
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  if (width < BREAKPOINTS.xl) return 'laptop';
  return 'desktop';
}

export function isMobileWidth(width: number): boolean {
  return resolveDeviceKind(width) === 'mobile';
}

export function isTabletWidth(width: number): boolean {
  return resolveDeviceKind(width) === 'tablet';
}

export function isLaptopWidth(width: number): boolean {
  return resolveDeviceKind(width) === 'laptop';
}

export function isDesktopWidth(width: number): boolean {
  return resolveDeviceKind(width) === 'desktop';
}

export function isLayoutDesktopWidth(width: number): boolean {
  return isMinWidth(width, 'lg');
}
