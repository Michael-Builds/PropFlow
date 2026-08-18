import { Injectable, signal } from '@angular/core';
import { minWidthQuery, subscribeBreakpoint } from '../../utils';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly _collapsed = signal(false);
  private readonly _mobileOpen = signal(false);

  readonly collapsed = this._collapsed.asReadonly();
  readonly mobileOpen = this._mobileOpen.asReadonly();
  readonly layoutDesktopQuery = minWidthQuery('lg');

  constructor() {
    subscribeBreakpoint('lg', (matches) => {
      if (matches) this.closeMobile();
    });
  }

  toggleCollapsed(): void {
    this._collapsed.update((value) => !value);
  }

  setCollapsed(value: boolean): void {
    this._collapsed.set(value);
  }

  openMobile(): void {
    this._mobileOpen.set(true);
  }

  closeMobile(): void {
    this._mobileOpen.set(false);
  }

  toggleMobile(): void {
    this._mobileOpen.update((value) => !value);
  }
}
