import { BadgeVariant } from './badge.interface';
import { ButtonVariant } from './button.interface';
import { NavIconName } from './nav.interface';

export type DetailField =
  | {
      label: string;
      kind: 'text';
      value: string;
      emphasis?: boolean;
      tabular?: boolean;
      mono?: boolean;
    }
  | { label: string; kind: 'badge'; value: string; variant: BadgeVariant };

export type DetailStat = {
  label: string;
  value: string;
  hint?: string;
};

export type DetailTimelineEvent = {
  id: string;
  title: string;
  description?: string;
  at: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
};

export type DetailDocument = {
  id: string;
  name: string;
  type: string;
  status: string;
  uploadedAt: string;
};

export type DetailQuickAction = {
  label: string;
  path: string;
  queryParams?: Record<string, string>;
  icon: NavIconName;
  variant: ButtonVariant;
};

export type DetailNote = {
  id: string;
  author: string;
  body: string;
  at: string;
};

export type DetailRelatedItem = {
  id: string;
  title: string;
  meta: string;
  path: string;
};

export type DetailRelatedGroup = {
  title: string;
  subtitle: string;
  empty: string;
  items: DetailRelatedItem[];
};
