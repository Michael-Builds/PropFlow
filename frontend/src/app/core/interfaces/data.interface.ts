export type DataCollection =
  | 'properties'
  | 'units'
  | 'tenants'
  | 'leases'
  | 'invoices'
  | 'payments'
  | 'arrears'
  | 'tickets'
  | 'documents'
  | 'notifications'
  | 'audit-logs'
  | 'users'
  | 'organizations';

export type FormFieldType = 'text' | 'email' | 'tel' | 'select' | 'date' | 'textarea' | 'number';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldOptionsFrom {
  collection: DataCollection;
  labelKey: string;
  valueKey?: string;
  hint?: string;
}

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  optionsFrom?: FormFieldOptionsFrom | FormFieldOptionsFrom[];
  searchable?: boolean;
  rows?: number;
}

export interface CollectionPageConfig {
  id: DataCollection;
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  createLabel: string;
  exportFileName: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
