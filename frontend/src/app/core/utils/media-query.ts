import { BreakpointName, minWidthQuery } from './breakpoints';

export type MediaQueryChangeHandler = (matches: boolean) => void;

export interface MediaQuerySubscription {
  matches: boolean;
  unsubscribe: () => void;
}

function canUseMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

export function createMediaQuery(query: string): MediaQueryList | null {
  if (!canUseMatchMedia()) return null;
  return window.matchMedia(query);
}

export function matchesMediaQuery(query: string): boolean {
  return createMediaQuery(query)?.matches ?? false;
}

export function matchesBreakpoint(breakpoint: BreakpointName): boolean {
  return matchesMediaQuery(minWidthQuery(breakpoint));
}

export function subscribeMediaQuery(
  query: string,
  handler: MediaQueryChangeHandler,
): MediaQuerySubscription {
  const mql = createMediaQuery(query);
  if (!mql) {
    return {
      matches: false,
      unsubscribe: () => undefined,
    };
  }

  const listener = (event: MediaQueryListEvent): void => {
    handler(event.matches);
  };

  mql.addEventListener('change', listener);
  handler(mql.matches);

  return {
    matches: mql.matches,
    unsubscribe: () => mql.removeEventListener('change', listener),
  };
}

export function subscribeBreakpoint(
  breakpoint: BreakpointName,
  handler: MediaQueryChangeHandler,
): MediaQuerySubscription {
  return subscribeMediaQuery(minWidthQuery(breakpoint), handler);
}
