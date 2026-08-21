import { environment } from '../../../../environments/environment';
import { BillingCycle, Currency, DataCollection, RecordStatus, TicketPriority, UnitStatus } from '../../enums';

export const API_BASE = environment.apiBaseUrl;

export type RecordRow = Record<string, unknown>;

export function unwrapItems(payload: unknown): RecordRow[] {
  if (Array.isArray(payload)) return payload as RecordRow[];
  if (payload && typeof payload === 'object' && 'items' in payload) {
    const items = (payload as { items: unknown }).items;
    return Array.isArray(items) ? (items as RecordRow[]) : [];
  }
  return [];
}

export function parseMoney(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function ghs(value: unknown): string {
  const amount = parseMoney(value);
  if (amount == null) return '—';
  return `GHS ${amount.toLocaleString('en-GH')}`;
}

export function isoDate(value: unknown): string {
  if (!value) return '';
  const text = String(value);
  return text.slice(0, 10);
}

export function fromApi(collection: string, row: RecordRow): RecordRow {
  switch (collection) {
    case DataCollection.Units:
      return {
        ...row,
        rent: ghs(row['rentAmount'] ?? row['rent']),
        rentAmount: parseMoney(row['rentAmount'] ?? row['rent']) ?? row['rentAmount'],
      };
    case DataCollection.Leases:
      return {
        ...row,
        rent: ghs(row['rentAmount'] ?? row['rent']),
        rentAmount: parseMoney(row['rentAmount'] ?? row['rent']) ?? row['rentAmount'],
        startDate: isoDate(row['startDate']),
        endDate: isoDate(row['endDate']),
      };
    case DataCollection.Invoices:
      return {
        ...row,
        amount: ghs(row['amountDue'] ?? row['amount']),
        balance: ghs(row['balance']),
        period: row['period'] ?? `${isoDate(row['periodStart'])} – ${isoDate(row['periodEnd'])}`,
        dueDate: isoDate(row['dueDate']),
        leaseId: row['leaseId'],
        tenantId: row['tenantId'],
      };
    case DataCollection.Payments:
      return {
        ...row,
        amount: typeof row['amount'] === 'number' ? ghs(row['amount']) : row['amount'],
        paidAt: isoDate(row['paidAt']),
      };
    case DataCollection.Arrears:
      return {
        ...row,
        lease: row['lease'] ?? row['leaseId'],
        lastReminder: isoDate(row['lastReminderAt'] ?? row['lastReminder']),
        balance: ghs(row['balance']),
        bucket: row['bucket'] ?? 'current',
      };
    case DataCollection.Tickets:
      return {
        ...row,
        slaDue: row['slaDue'] ?? row['slaDueAt'],
        assignee: row['assignee'] ?? row['vendorId'] ?? row['assigneeUserId'] ?? 'Unassigned',
        unit: row['unit'] ?? row['unitId'],
      };
    case DataCollection.Documents:
      return {
        ...row,
        type: row['type'] ?? row['docType'],
        entity: row['entity'] ?? row['entityId'],
        expiresAt: isoDate(row['expiresAt']),
      };
    case DataCollection.Users:
      return { ...row, fullName: row['fullName'] ?? row['email'] };
    case DataCollection.Organizations:
      return {
        ...row,
        users: row['users'] ?? 0,
        properties: row['properties'] ?? 0,
        onboarding: row['onboardingComplete'] === false ? 'pending' : 'complete',
        temporaryPassword: row['temporaryPassword'],
        ownerEmail: row['ownerEmail'],
      };
    default:
      return row;
  }
}

export function toApi(collection: string, payload: RecordRow): RecordRow {
  switch (collection) {
    case DataCollection.Properties:
      return {
        name: payload['name'],
        location: payload['location'],
        type: payload['type'],
        status: payload['status'] || RecordStatus.Active,
        manager: payload['manager'],
        yearBuilt: payload['yearBuilt'] ? Number(payload['yearBuilt']) : undefined,
      };
    case DataCollection.Units:
      return {
        propertyId: payload['propertyId'] ?? payload['property'],
        blockId: payload['blockId'] || undefined,
        unitCode: payload['unitCode'],
        type: payload['type'],
        rentAmount: parseMoney(payload['rentAmount'] ?? payload['rent']),
        currency: Currency.Ghs,
        status: payload['status'] || UnitStatus.Vacant,
      };
    case DataCollection.Tenants:
      return {
        fullName: payload['fullName'],
        email: payload['email'],
        phone: payload['phone'],
        kycStatus: payload['kycStatus'],
        status: payload['status'] || RecordStatus.Active,
      };
    case DataCollection.Leases:
      return {
        tenantId: payload['tenantId'] ?? payload['tenant'],
        unitId: payload['unitId'] ?? payload['unit'],
        startDate: payload['startDate'],
        endDate: payload['endDate'],
        rentAmount: parseMoney(payload['rentAmount'] ?? payload['rent']),
        dueDay: Number(payload['dueDay'] ?? 5),
        billingCycle: payload['billingCycle'] || BillingCycle.Monthly,
        status: payload['status'],
      };
    case DataCollection.Invoices:
      return {
        leaseId: payload['leaseId'] ?? payload['lease'],
        periodStart: payload['periodStart'],
        periodEnd: payload['periodEnd'],
        dueDate: payload['dueDate'],
        amount: parseMoney(payload['amount'] ?? payload['amountDue']),
        notes: payload['notes'],
      };
    case DataCollection.Payments:
      return {
        invoiceId: payload['invoiceId'],
        amount: parseMoney(payload['amount']),
        method: payload['method'],
        reference: payload['reference'],
        paidAt: payload['paidAt'],
      };
    case DataCollection.Tickets:
      return {
        propertyId: payload['propertyId'],
        unitId: payload['unitId'] ?? payload['unit'],
        category: payload['category'],
        priority: payload['priority'] || TicketPriority.Medium,
        notes: payload['notes'],
      };
    case DataCollection.Documents:
      return {
        entityType: payload['entityType'],
        entityId: payload['entityId'] ?? payload['entity'],
        docType: payload['docType'] ?? payload['type'],
        fileUrl: payload['fileUrl'] || 'pending://upload',
        expiresAt: payload['expiresAt'] || undefined,
      };
    case DataCollection.Users:
      return {
        email: payload['email'],
        fullName: payload['fullName'],
        role: payload['role'],
        password: payload['password'] || undefined,
        tenantId: payload['tenantId'] || undefined,
        vendorId: payload['vendorId'] || undefined,
        status: payload['status'],
      };
    case DataCollection.Organizations:
      return {
        name: payload['name'],
        ownerEmail: payload['ownerEmail'],
        ownerFullName: payload['ownerFullName'],
        phone: payload['phone'] || undefined,
        address: payload['address'] || undefined,
        city: payload['city'] || undefined,
      };
    default:
      return payload;
  }
}

export function collectionPath(name: string): string {
  if (name === DataCollection.Organizations) return `${API_BASE}/platform/organizations`;
  if (name === DataCollection.AuditLogs) return `${API_BASE}/audit-logs`;
  if (name === DataCollection.Arrears) return `${API_BASE}/arrears`;
  return `${API_BASE}/${name}`;
}
