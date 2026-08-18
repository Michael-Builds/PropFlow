import { enumValues } from './helpers';

export enum DataCollection {
  Properties = 'properties',
  Units = 'units',
  Tenants = 'tenants',
  Leases = 'leases',
  Invoices = 'invoices',
  Payments = 'payments',
  Arrears = 'arrears',
  Tickets = 'tickets',
  Documents = 'documents',
  Notifications = 'notifications',
  AuditLogs = 'audit-logs',
  Users = 'users',
  Organizations = 'organizations',
}

export const DATA_COLLECTIONS = enumValues(DataCollection);

export const LOOKUP_COLLECTIONS = [
  DataCollection.Properties,
  DataCollection.Units,
  DataCollection.Tenants,
  DataCollection.Leases,
  DataCollection.Invoices,
  DataCollection.Users,
] as const;

export const AGREEMENT_SOURCE_COLLECTIONS = [
  DataCollection.Documents,
  DataCollection.Leases,
  DataCollection.Tenants,
  DataCollection.Units,
] as const;

export function collectionRoute(name: DataCollection, id?: string): string {
  return id ? `/${name}/${id}` : `/${name}`;
}
