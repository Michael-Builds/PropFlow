export type ThemeId = 'atlantic' | 'forest' | 'ember' | 'graphite' | 'orchid';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string;
  accent: string;
  navy: string;
}
