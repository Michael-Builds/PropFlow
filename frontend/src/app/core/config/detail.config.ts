import { DataCollection } from '../interfaces/data.interface';
import {
  DetailDocument,
  DetailField,
  DetailNote,
  DetailQuickAction,
  DetailRelatedGroup,
  DetailStat,
  DetailTimelineEvent,
} from '../interfaces/detail.interface';
import { badgeVariantFor, prettyLabel } from '../utils';
import { RecordRow } from '../services/data/data.service';
import { COLLECTION_PAGES } from './collections.config';

export interface CollectionDetailModel {
  title: string;
  description: string;
  badgeLabel: string;
  stats: DetailStat[];
  overview: DetailField[];
  related: DetailRelatedGroup[];
  documents: DetailDocument[];
  timeline: DetailTimelineEvent[];
  notes: DetailNote[];
  actions: DetailQuickAction[];
}

function text(record: RecordRow, key: string, fallback = '—'): string {
  const value = record[key];
  if (value == null || value === '') return fallback;
  return String(value);
}

function field(label: string, value: string, extra?: Partial<Extract<DetailField, { kind: 'text' }>>): DetailField {
  return { label, kind: 'text', value, ...extra };
}

function badge(label: string, value: string): DetailField {
  return { label, kind: 'badge', value: prettyLabel(value), variant: badgeVariantFor(value) };
}

function items(
  rows: RecordRow[],
  titleKey: string,
  metaKeys: string[],
  path: string,
): DetailRelatedGroup['items'] {
  return rows.slice(0, 8).map((row) => ({
    id: text(row, 'id'),
    title: text(row, titleKey, text(row, 'id')),
    meta: metaKeys.map((key) => text(row, key)).join(' · '),
    path: `${path}/${text(row, 'id')}`,
  }));
}

function docsFrom(rows: RecordRow[]): DetailDocument[] {
  return rows.slice(0, 8).map((row) => ({
    id: text(row, 'id'),
    name: text(row, 'id'),
    type: prettyLabel(text(row, 'type')),
    status: text(row, 'status'),
    uploadedAt: text(row, 'uploadedAt', text(row, 'expiresAt')),
  }));
}

export function buildCollectionDetail(
  collection: DataCollection,
  record: RecordRow,
  related: Partial<Record<DataCollection, RecordRow[]>>,
): CollectionDetailModel {
  const page = COLLECTION_PAGES[collection];
  const id = text(record, 'id');
  const status = text(record, 'status', text(record, 'kycStatus', text(record, 'priority', 'active')));

  const baseNotes: DetailNote[] = [
    {
      id: 'note_ops',
      author: 'Ama Owusu',
      body: `Reviewed in the ${page.title.toLowerCase()} workspace. Follow the related records and SLA timestamps before changing status.`,
      at: text(record, 'createdAt', text(record, 'joinedAt', text(record, 'openedAt', '2026-08-12T09:00:00.000Z'))),
    },
  ];

  switch (collection) {
    case 'properties': {
      const units = related.units ?? [];
      const occupied = units.filter((row) => row['status'] === 'occupied').length;
      return {
        title: text(record, 'name'),
        description: text(record, 'location'),
        badgeLabel: status,
        stats: [
          { label: 'Units', value: text(record, 'units'), hint: 'Registered in this block' },
          { label: 'Occupancy', value: text(record, 'occupancy'), hint: `${occupied} occupied in sample` },
          { label: 'Type', value: text(record, 'type'), hint: 'Asset mix' },
          { label: 'Year built', value: text(record, 'yearBuilt'), hint: 'As recorded' },
        ],
        overview: [
          field('Property ID', id, { mono: true, emphasis: true }),
          badge('Status', status),
          field('Manager', text(record, 'manager')),
          field('Address', text(record, 'address', text(record, 'location'))),
          field('Created', text(record, 'createdAt')),
        ],
        related: [
          {
            title: 'Units',
            subtitle: 'Occupancy and rent on this property',
            empty: 'No units linked yet.',
            items: items(units, 'unitCode', ['type', 'rent', 'status'], '/units'),
          },
        ],
        documents: docsFrom(related.documents ?? []),
        timeline: [
          { id: 't1', title: 'Property onboarded', description: text(record, 'name'), at: text(record, 'createdAt'), tone: 'success' },
          { id: 't2', title: 'Manager assigned', description: text(record, 'manager'), at: text(record, 'createdAt'), tone: 'info' },
        ],
        notes: baseNotes,
        actions: [
          { label: 'View units', path: '/units', icon: 'door', variant: 'soft' },
          { label: 'Documents', path: '/documents', icon: 'folder', variant: 'secondary' },
          { label: 'Maintenance', path: '/tickets', icon: 'wrench', variant: 'secondary' },
        ],
      };
    }
    case 'units':
      return {
        title: text(record, 'unitCode'),
        description: `${text(record, 'property')} · ${text(record, 'type')}`,
        badgeLabel: status,
        stats: [
          { label: 'Rent', value: text(record, 'rent'), hint: 'Monthly' },
          { label: 'Floor', value: text(record, 'floor'), hint: 'Level' },
          { label: 'Area', value: `${text(record, 'sqm')} m²`, hint: 'Internal area' },
          { label: 'Type', value: text(record, 'type'), hint: 'Layout' },
        ],
        overview: [
          field('Unit ID', id, { mono: true, emphasis: true }),
          badge('Status', status),
          field('Property', text(record, 'property')),
          field('Unit code', text(record, 'unitCode')),
        ],
        related: [
          {
            title: 'Leases',
            subtitle: 'Occupancy history for this unit',
            empty: 'No leases on this unit.',
            items: items(related.leases ?? [], 'tenant', ['startDate', 'endDate', 'status'], '/leases'),
          },
          {
            title: 'Tickets',
            subtitle: 'Maintenance against this unit',
            empty: 'No open or historical tickets.',
            items: items(related.tickets ?? [], 'id', ['category', 'priority', 'status'], '/tickets'),
          },
        ],
        documents: [],
        timeline: [
          { id: 't1', title: 'Unit registered', at: '2025-03-12T10:00:00.000Z', tone: 'info' },
          { id: 't2', title: `Marked ${status}`, at: '2026-06-01T09:00:00.000Z', tone: status === 'occupied' ? 'success' : 'warning' },
        ],
        notes: baseNotes,
        actions: [
          { label: 'Property', path: `/properties/${text(record, 'propertyId')}`, icon: 'building', variant: 'soft' },
          { label: 'Leases', path: '/leases', icon: 'file', variant: 'secondary' },
        ],
      };
    case 'tenants':
      return {
        title: text(record, 'fullName'),
        description: text(record, 'email'),
        badgeLabel: text(record, 'kycStatus'),
        stats: [
          { label: 'KYC', value: prettyLabel(text(record, 'kycStatus')), hint: 'Identity check' },
          { label: 'Status', value: prettyLabel(status), hint: 'Occupant state' },
          { label: 'Occupation', value: text(record, 'occupation'), hint: 'Profile' },
          { label: 'Joined', value: text(record, 'joinedAt'), hint: 'First recorded' },
        ],
        overview: [
          field('Tenant ID', id, { mono: true, emphasis: true }),
          badge('KYC', text(record, 'kycStatus')),
          badge('Status', status),
          field('Phone', text(record, 'phone')),
          field('Emergency', text(record, 'emergencyContact')),
        ],
        related: [
          {
            title: 'Leases',
            subtitle: 'Current and past occupancy',
            empty: 'No leases for this tenant.',
            items: items(related.leases ?? [], 'unit', ['rent', 'status'], '/leases'),
          },
          {
            title: 'Invoices',
            subtitle: 'Rent bills',
            empty: 'No invoices yet.',
            items: items(related.invoices ?? [], 'period', ['amount', 'status'], '/invoices'),
          },
        ],
        documents: docsFrom(related.documents ?? []),
        timeline: [
          { id: 't1', title: 'Tenant created', at: text(record, 'joinedAt'), tone: 'success' },
          { id: 't2', title: `KYC ${text(record, 'kycStatus')}`, at: text(record, 'joinedAt'), tone: text(record, 'kycStatus') === 'verified' ? 'success' : 'warning' },
        ],
        notes: baseNotes,
        actions: [
          { label: 'Payments', path: '/payments', icon: 'wallet', variant: 'soft' },
          { label: 'Arrears', path: '/arrears', icon: 'alert', variant: 'secondary' },
        ],
      };
    case 'leases':
      return {
        title: id,
        description: `${text(record, 'tenant')} · ${text(record, 'unit')}`,
        badgeLabel: status,
        stats: [
          { label: 'Rent', value: text(record, 'rent'), hint: 'Contract rent' },
          { label: 'Start', value: text(record, 'startDate'), hint: 'Commencement' },
          { label: 'End', value: text(record, 'endDate'), hint: 'Expiry' },
          { label: 'Status', value: prettyLabel(status), hint: 'Lifecycle' },
        ],
        overview: [
          field('Lease ID', id, { mono: true, emphasis: true }),
          badge('Status', status),
          field('Tenant', text(record, 'tenant')),
          field('Unit', text(record, 'unit')),
        ],
        related: [
          {
            title: 'Invoices',
            subtitle: 'Billed against this lease',
            empty: 'No invoices generated.',
            items: items(related.invoices ?? [], 'period', ['amount', 'balance', 'status'], '/invoices'),
          },
        ],
        documents: docsFrom(related.documents ?? []),
        timeline: [
          { id: 't1', title: 'Lease started', at: text(record, 'startDate'), tone: 'success' },
          { id: 't2', title: 'Lease ends', at: text(record, 'endDate'), tone: status === 'ending' ? 'warning' : 'info' },
        ],
        notes: baseNotes,
        actions: [
          { label: 'Tenant', path: `/tenants/${text(record, 'tenantId')}`, icon: 'users', variant: 'soft' },
          { label: 'Unit', path: `/units/${text(record, 'unitId')}`, icon: 'door', variant: 'secondary' },
        ],
      };
    case 'invoices':
      return {
        title: id,
        description: `${text(record, 'tenant')} · ${text(record, 'period')}`,
        badgeLabel: status,
        stats: [
          { label: 'Amount', value: text(record, 'amount'), hint: 'Invoice total' },
          { label: 'Balance', value: text(record, 'balance'), hint: 'Outstanding' },
          { label: 'Due', value: text(record, 'dueDate'), hint: 'Due date' },
          { label: 'Status', value: prettyLabel(status), hint: 'Collections' },
        ],
        overview: [
          field('Invoice ID', id, { mono: true, emphasis: true }),
          badge('Status', status),
          field('Tenant', text(record, 'tenant')),
          field('Period', text(record, 'period')),
        ],
        related: [
          {
            title: 'Payments',
            subtitle: 'Receipts applied to this invoice',
            empty: 'No payments posted yet.',
            items: items(related.payments ?? [], 'amount', ['method', 'reference', 'paidAt'], '/payments'),
          },
        ],
        documents: [],
        timeline: [
          { id: 't1', title: 'Invoice issued', at: text(record, 'dueDate'), tone: 'info' },
          { id: 't2', title: prettyLabel(status), at: text(record, 'dueDate'), tone: status === 'paid' ? 'success' : 'warning' },
        ],
        notes: baseNotes,
        actions: [
          { label: 'Post payment', path: '/payments', icon: 'wallet', variant: 'soft' },
          { label: 'Arrears', path: '/arrears', icon: 'alert', variant: 'secondary' },
        ],
      };
    case 'payments':
      return {
        title: id,
        description: `${text(record, 'tenant')} · ${text(record, 'amount')}`,
        badgeLabel: prettyLabel(text(record, 'method')),
        stats: [
          { label: 'Amount', value: text(record, 'amount'), hint: 'Posted' },
          { label: 'Method', value: prettyLabel(text(record, 'method')), hint: 'Channel' },
          { label: 'Paid at', value: text(record, 'paidAt'), hint: 'Value date' },
          { label: 'Invoice', value: text(record, 'invoiceId'), hint: 'Applied to' },
        ],
        overview: [
          field('Payment ID', id, { mono: true, emphasis: true }),
          field('Reference', text(record, 'reference'), { mono: true }),
          field('Tenant', text(record, 'tenant')),
          field('Invoice', text(record, 'invoiceId'), { mono: true }),
        ],
        related: [],
        documents: [],
        timeline: [{ id: 't1', title: 'Payment posted', description: text(record, 'reference'), at: text(record, 'paidAt'), tone: 'success' }],
        notes: baseNotes,
        actions: [
          { label: 'Invoice', path: `/invoices/${text(record, 'invoiceId')}`, icon: 'invoice', variant: 'soft' },
          { label: 'Tenant', path: `/tenants/${text(record, 'tenantId')}`, icon: 'users', variant: 'secondary' },
        ],
      };
    case 'arrears':
      return {
        title: text(record, 'tenant'),
        description: `${text(record, 'bucket')} · ${text(record, 'balance')}`,
        badgeLabel: text(record, 'bucket'),
        stats: [
          { label: 'Balance', value: text(record, 'balance'), hint: 'Outstanding' },
          { label: 'Bucket', value: text(record, 'bucket'), hint: 'Aging' },
          { label: 'Lease', value: text(record, 'lease'), hint: 'Linked lease' },
          { label: 'Last reminder', value: text(record, 'lastReminder'), hint: 'Collections' },
        ],
        overview: [
          field('Arrears ID', id, { mono: true, emphasis: true }),
          badge('Bucket', text(record, 'bucket')),
          field('Tenant', text(record, 'tenant')),
          field('Invoice', text(record, 'invoiceId', '—'), { mono: true }),
        ],
        related: [],
        documents: [],
        timeline: [
          { id: 't1', title: 'Entered arrears', at: text(record, 'lastReminder'), tone: 'warning' },
          { id: 't2', title: 'Reminder sent', at: text(record, 'lastReminder'), tone: 'info' },
        ],
        notes: [
          {
            id: 'note_col',
            author: 'Kwesi Darko',
            body: 'Keep reminders factual. Do not threaten eviction from this console — that is a legal process.',
            at: text(record, 'lastReminder'),
          },
        ],
        actions: [
          { label: 'Tenant', path: `/tenants/${text(record, 'tenantId')}`, icon: 'users', variant: 'soft' },
          { label: 'Invoices', path: '/invoices', icon: 'invoice', variant: 'secondary' },
        ],
      };
    case 'tickets':
      return {
        title: id,
        description: `${prettyLabel(text(record, 'category'))} · ${text(record, 'unit')}`,
        badgeLabel: status,
        stats: [
          { label: 'Priority', value: prettyLabel(text(record, 'priority')), hint: 'Queue rank' },
          { label: 'Assignee', value: text(record, 'assignee'), hint: 'Vendor or staff' },
          { label: 'SLA due', value: text(record, 'slaDue'), hint: 'Resolution target' },
          { label: 'Status', value: prettyLabel(status), hint: 'Workflow' },
        ],
        overview: [
          field('Ticket ID', id, { mono: true, emphasis: true }),
          badge('Status', status),
          badge('Priority', text(record, 'priority')),
          field('Unit', text(record, 'unit')),
          field('Opened', text(record, 'openedAt')),
        ],
        related: [],
        documents: [],
        timeline: [
          { id: 't1', title: 'Ticket opened', at: text(record, 'openedAt'), tone: 'info' },
          { id: 't2', title: `Now ${prettyLabel(status)}`, at: text(record, 'slaDue'), tone: status === 'closed' || status === 'resolved' ? 'success' : 'warning' },
        ],
        notes: baseNotes,
        actions: [
          { label: 'Unit', path: `/units/${text(record, 'unitId')}`, icon: 'door', variant: 'soft' },
          { label: 'All tickets', path: '/tickets', icon: 'wrench', variant: 'secondary' },
        ],
      };
    case 'documents':
      return {
        title: id,
        description: `${prettyLabel(text(record, 'type'))} · ${text(record, 'entity')}`,
        badgeLabel: status,
        stats: [
          { label: 'Type', value: prettyLabel(text(record, 'type')), hint: 'Vault class' },
          { label: 'Status', value: prettyLabel(status), hint: 'Validity' },
          { label: 'Expires', value: text(record, 'expiresAt'), hint: 'Highlight window' },
          { label: 'Uploaded', value: text(record, 'uploadedAt'), hint: 'Vaulted on' },
        ],
        overview: [
          field('Document ID', id, { mono: true, emphasis: true }),
          badge('Status', status),
          field('Entity', text(record, 'entity')),
          field('Entity type', prettyLabel(text(record, 'entityType'))),
        ],
        related: [],
        documents: docsFrom([record]),
        timeline: [
          { id: 't1', title: 'Uploaded', at: text(record, 'uploadedAt'), tone: 'success' },
          { id: 't2', title: 'Expiry', at: text(record, 'expiresAt'), tone: status === 'valid' ? 'info' : 'warning' },
        ],
        notes: baseNotes,
        actions: [
          {
            label: prettyLabel(text(record, 'entityType')),
            path: text(record, 'entityType') === 'property' ? `/properties/${text(record, 'entityId')}` : `/tenants/${text(record, 'entityId')}`,
            icon: text(record, 'entityType') === 'property' ? 'building' : 'users',
            variant: 'soft',
          },
        ],
      };
    case 'notifications':
      return {
        title: text(record, 'title'),
        description: text(record, 'message'),
        badgeLabel: text(record, 'type'),
        stats: [
          { label: 'Type', value: prettyLabel(text(record, 'type')), hint: 'Channel' },
          { label: 'Read', value: record['read'] ? 'Yes' : 'No', hint: 'Inbox state' },
          { label: 'When', value: text(record, 'createdAt'), hint: 'Raised' },
          { label: 'ID', value: id, hint: 'Notification' },
        ],
        overview: [
          field('Notification ID', id, { mono: true, emphasis: true }),
          badge('Type', text(record, 'type')),
          field('Message', text(record, 'message')),
        ],
        related: [],
        documents: [],
        timeline: [{ id: 't1', title: 'Notification raised', at: text(record, 'createdAt'), tone: 'info' }],
        notes: [],
        actions: [
          { label: 'Inbox', path: '/notifications', icon: 'bell', variant: 'soft' },
          { label: 'Audit logs', path: '/audit-logs', icon: 'shield', variant: 'secondary' },
        ],
      };
    default:
      return {
        title: text(record, 'action', id),
        description: `${text(record, 'actor')} · ${text(record, 'entity')}`,
        badgeLabel: 'audit',
        stats: [
          { label: 'Actor', value: text(record, 'actor'), hint: 'Who' },
          { label: 'Action', value: text(record, 'action'), hint: 'What' },
          { label: 'Entity', value: text(record, 'entity'), hint: 'Target' },
          { label: 'IP', value: text(record, 'ip'), hint: 'Source' },
        ],
        overview: [
          field('Audit ID', id, { mono: true, emphasis: true }),
          field('Actor', text(record, 'actor')),
          field('Action', text(record, 'action'), { mono: true }),
          field('When', text(record, 'createdAt')),
        ],
        related: [],
        documents: [],
        timeline: [{ id: 't1', title: text(record, 'action'), description: text(record, 'entity'), at: text(record, 'createdAt'), tone: 'info' }],
        notes: [],
        actions: [{ label: 'All audit logs', path: '/audit-logs', icon: 'shield', variant: 'soft' }],
      };
  }
}
