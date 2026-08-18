import { environment } from '../../../../environments/environment';

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
    case 'units':
      return {
        ...row,
        rent: ghs(row['rentAmount'] ?? row['rent']),
        rentAmount: parseMoney(row['rentAmount'] ?? row['rent']) ?? row['rentAmount'],
      };
    case 'leases':
      return {
        ...row,
        rent: ghs(row['rentAmount'] ?? row['rent']),
        rentAmount: parseMoney(row['rentAmount'] ?? row['rent']) ?? row['rentAmount'],
        startDate: isoDate(row['startDate']),
        endDate: isoDate(row['endDate']),
      };
    case 'invoices':
      return {
        ...row,
        amount: ghs(row['amountDue'] ?? row['amount']),
        balance: ghs(row['balance']),
        period: row['period'] ?? `${isoDate(row['periodStart'])} – ${isoDate(row['periodEnd'])}`,
        dueDate: isoDate(row['dueDate']),
        leaseId: row['leaseId'],
        tenantId: row['tenantId'],
      };
    case 'payments':
      return {
        ...row,
        amount: typeof row['amount'] === 'number' ? ghs(row['amount']) : row['amount'],
        paidAt: isoDate(row['paidAt']),
      };
    case 'arrears':
      return {
        ...row,
        lease: row['lease'] ?? row['leaseId'],
        lastReminder: isoDate(row['lastReminderAt'] ?? row['lastReminder']),
        balance: ghs(row['balance']),
        bucket: row['bucket'] ?? 'current',
      };
    case 'tickets':
      return {
        ...row,
        slaDue: row['slaDue'] ?? row['slaDueAt'],
        assignee: row['assignee'] ?? row['vendorId'] ?? row['assigneeUserId'] ?? 'Unassigned',
        unit: row['unit'] ?? row['unitId'],
      };
    case 'documents':
      return {
        ...row,
        type: row['type'] ?? row['docType'],
        entity: row['entity'] ?? row['entityId'],
        expiresAt: isoDate(row['expiresAt']),
      };
    case 'users':
      return { ...row, fullName: row['fullName'] ?? row['email'] };
    case 'organizations':
      return {
        ...row,
        users: row['users'] ?? 0,
        properties: row['properties'] ?? 0,
      };
    default:
      return row;
  }
}

export function toApi(collection: string, payload: RecordRow): RecordRow {
  switch (collection) {
    case 'properties':
      return {
        name: payload['name'],
        location: payload['location'],
        type: payload['type'],
        status: payload['status'] || 'active',
        manager: payload['manager'],
        yearBuilt: payload['yearBuilt'] ? Number(payload['yearBuilt']) : undefined,
      };
    case 'units':
      return {
        propertyId: payload['propertyId'] ?? payload['property'],
        blockId: payload['blockId'] || undefined,
        unitCode: payload['unitCode'],
        type: payload['type'],
        rentAmount: parseMoney(payload['rentAmount'] ?? payload['rent']),
        currency: 'GHS',
        status: payload['status'] || 'vacant',
      };
    case 'tenants':
      return {
        fullName: payload['fullName'],
        email: payload['email'],
        phone: payload['phone'],
        kycStatus: payload['kycStatus'],
        status: payload['status'] || 'active',
      };
    case 'leases':
      return {
        tenantId: payload['tenantId'] ?? payload['tenant'],
        unitId: payload['unitId'] ?? payload['unit'],
        startDate: payload['startDate'],
        endDate: payload['endDate'],
        rentAmount: parseMoney(payload['rentAmount'] ?? payload['rent']),
        dueDay: Number(payload['dueDay'] ?? 5),
        billingCycle: payload['billingCycle'] || 'monthly',
        status: payload['status'],
      };
    case 'invoices':
      return {
        leaseId: payload['leaseId'] ?? payload['lease'],
        periodStart: payload['periodStart'],
        periodEnd: payload['periodEnd'],
        dueDate: payload['dueDate'],
        amount: parseMoney(payload['amount'] ?? payload['amountDue']),
        notes: payload['notes'],
      };
    case 'payments':
      return {
        invoiceId: payload['invoiceId'],
        amount: parseMoney(payload['amount']),
        method: payload['method'],
        reference: payload['reference'],
        paidAt: payload['paidAt'],
      };
    case 'tickets':
      return {
        propertyId: payload['propertyId'],
        unitId: payload['unitId'] ?? payload['unit'],
        category: payload['category'],
        priority: payload['priority'] || 'medium',
        notes: payload['notes'],
      };
    case 'documents':
      return {
        entityType: payload['entityType'],
        entityId: payload['entityId'] ?? payload['entity'],
        docType: payload['docType'] ?? payload['type'],
        fileUrl: payload['fileUrl'] || 'pending://upload',
        expiresAt: payload['expiresAt'] || undefined,
      };
    case 'users':
      return {
        email: payload['email'],
        fullName: payload['fullName'],
        role: payload['role'],
        password: payload['password'] || undefined,
        tenantId: payload['tenantId'] || undefined,
        vendorId: payload['vendorId'] || undefined,
        status: payload['status'],
      };
    case 'organizations':
      return {
        name: payload['name'],
        ownerEmail: payload['ownerEmail'],
        ownerFullName: payload['ownerFullName'],
        ownerPassword: payload['ownerPassword'] || undefined,
      };
    default:
      return payload;
  }
}

export function collectionPath(name: string): string {
  if (name === 'organizations') return `${API_BASE}/platform/organizations`;
  if (name === 'audit-logs') return `${API_BASE}/audit-logs`;
  if (name === 'arrears') return `${API_BASE}/arrears`;
  return `${API_BASE}/${name}`;
}
