import { resolveDeviceKind, type DeviceKind } from './breakpoints';
import { createMediaQuery } from './media-query';

export function getViewportWidth(fallback = 0): number {
  if (typeof window === 'undefined') return fallback;
  return window.innerWidth;
}

export function getDeviceKind(fallbackWidth = 0): DeviceKind {
  return resolveDeviceKind(getViewportWidth(fallbackWidth));
}

export function isMobileViewport(): boolean {
  return getDeviceKind() === 'mobile';
}

export function isTabletViewport(): boolean {
  return getDeviceKind() === 'tablet';
}

export function isLaptopViewport(): boolean {
  return getDeviceKind() === 'laptop';
}

export function isDesktopViewport(): boolean {
  return getDeviceKind() === 'desktop';
}

export function isLayoutDesktopViewport(): boolean {
  const mql = createMediaQuery('(min-width: 1024px)');
  if (mql) return mql.matches;
  return getViewportWidth() >= 1024;
}
