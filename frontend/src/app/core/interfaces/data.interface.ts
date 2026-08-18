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
  | 'audit-logs';

export type FormFieldType = 'text' | 'email' | 'select' | 'date' | 'textarea' | 'number';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
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
