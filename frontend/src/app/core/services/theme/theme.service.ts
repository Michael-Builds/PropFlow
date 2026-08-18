import { Injectable, signal } from '@angular/core';
import { THEMES } from '../../config/nav.config';
import { ThemeId } from '../../interfaces/theme.interface';

const THEME_KEY = 'propflow.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes = THEMES;
  readonly theme = signal<ThemeId>(this.readTheme());

  constructor() {
    if (typeof document !== 'undefined') {
      this.apply(this.theme());
    }
  }

  setTheme(id: ThemeId): void {
    this.theme.set(id);
    localStorage.setItem(THEME_KEY, id);
    this.apply(id);
  }

  private readTheme(): ThemeId {
    const stored = localStorage.getItem(THEME_KEY) as ThemeId | null;
    return this.themes.some((theme) => theme.id === stored) ? stored! : 'atlantic';
  }

  private apply(id: ThemeId): void {
    document.documentElement.setAttribute('data-theme', id);
  }
}
