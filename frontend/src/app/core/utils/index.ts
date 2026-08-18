export {
  BREAKPOINTS,
  minWidthQuery,
  maxWidthQuery,
  isMinWidth,
  isMaxWidth,
  resolveDeviceKind,
  isMobileWidth,
  isTabletWidth,
  isLaptopWidth,
  isDesktopWidth,
  isLayoutDesktopWidth,
} from './breakpoints';
export type { BreakpointName, DeviceKind } from './breakpoints';

export {
  createMediaQuery,
  matchesMediaQuery,
  matchesBreakpoint,
  subscribeMediaQuery,
  subscribeBreakpoint,
} from './media-query';
export type { MediaQueryChangeHandler, MediaQuerySubscription } from './media-query';

export {
  getViewportWidth,
  getDeviceKind,
  isMobileViewport,
  isTabletViewport,
  isLaptopViewport,
  isDesktopViewport,
  isLayoutDesktopViewport,
} from './device';

export {
  truncateText,
  initialsFromName,
  formatRelativeTime,
  formatNumber,
  formatPercent,
  formatGhs,
  badgeVariantFor,
  prettyLabel,
  formatDisplayDate,
} from './format';

export { oddLastGridClass, isOddLastItem } from './layout';
export { loadDetailRecord } from './detail-loader';
