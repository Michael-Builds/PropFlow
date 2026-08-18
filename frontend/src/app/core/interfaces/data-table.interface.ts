import { BadgeVariant } from './badge.interface';

export type DataTableAlign = 'left' | 'center' | 'right';

export type DataTableCellType = 'text' | 'badge' | 'date' | 'actions';

export interface DataTableRowAction {
  id: string;
  label: string;
  tone?: 'default' | 'danger';
}

export interface DataTableRowActionEvent<T = any> {
  action: DataTableRowAction;
  row: T;
  event: Event;
}

export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  type?: DataTableCellType;
  sortable?: boolean;
  filterable?: boolean;
  align?: DataTableAlign;
  widthClass?: string;
  cellClass?: string;
  value?: (row: T) => string | number | boolean | null | undefined;
  badgeVariant?: BadgeVariant | ((row: T) => BadgeVariant);
  dateFormat?: string;
  actions?: readonly DataTableRowAction[];
  resolveActions?: (row: T) => readonly DataTableRowAction[];
}

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: DataTableFilterOption[];
}
