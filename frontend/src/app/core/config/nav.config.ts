import { NavSection } from '../interfaces/nav.interface';
import { ThemeOption } from '../interfaces/theme.interface';
import { DataCollection, collectionRoute } from '../enums/data-collection.enum';
import { USER_ROLE_LABELS, UserRoles } from '../enums/user-role.enum';

export const ROLE_LABELS = USER_ROLE_LABELS;

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: UserRoles.all },
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    items: [
      { id: DataCollection.Properties, label: 'Properties', path: collectionRoute(DataCollection.Properties), icon: 'building', roles: UserRoles.portfolio },
      { id: DataCollection.Units, label: 'Units', path: collectionRoute(DataCollection.Units), icon: 'door', roles: UserRoles.portfolio },
      { id: DataCollection.Tenants, label: 'Tenants', path: collectionRoute(DataCollection.Tenants), icon: 'users', roles: UserRoles.portfolio },
      { id: DataCollection.Leases, label: 'Leases', path: collectionRoute(DataCollection.Leases), icon: 'file', roles: UserRoles.portfolio },
    ],
  },
  {
    id: 'finance',
    label: 'Collections',
    items: [
      { id: DataCollection.Invoices, label: 'Invoices', path: collectionRoute(DataCollection.Invoices), icon: 'invoice', roles: UserRoles.collections },
      { id: DataCollection.Payments, label: 'Payments', path: collectionRoute(DataCollection.Payments), icon: 'wallet', roles: UserRoles.collections },
      { id: DataCollection.Arrears, label: 'Arrears', path: collectionRoute(DataCollection.Arrears), icon: 'alert', roles: UserRoles.collections },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    items: [
      { id: DataCollection.Tickets, label: 'Maintenance', path: collectionRoute(DataCollection.Tickets), icon: 'wrench', roles: UserRoles.tickets },
      { id: DataCollection.Documents, label: 'Documents', path: collectionRoute(DataCollection.Documents), icon: 'folder', roles: UserRoles.documents },
      { id: DataCollection.Notifications, label: 'Notifications', path: collectionRoute(DataCollection.Notifications), icon: 'bell', roles: UserRoles.all, badgeKey: DataCollection.Notifications },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      { id: DataCollection.Organizations, label: 'Companies', path: collectionRoute(DataCollection.Organizations), icon: 'globe', roles: UserRoles.platform },
      { id: DataCollection.Users, label: 'Users', path: collectionRoute(DataCollection.Users), icon: 'users', roles: UserRoles.portfolio },
      { id: DataCollection.AuditLogs, label: 'Audit logs', path: collectionRoute(DataCollection.AuditLogs), icon: 'shield', roles: UserRoles.audit },
      { id: 'appearance', label: 'Appearance', path: '/appearance', icon: 'palette', roles: UserRoles.all },
    ],
  },
];

export const THEMES: ThemeOption[] = [
  { id: 'atlantic', name: 'Atlantic', description: 'Electric blue over navy — operations default.', swatch: '#0028f2', accent: '#3d5cff', navy: '#0f1035' },
  { id: 'forest', name: 'Forest', description: 'Deep greens for property portfolios.', swatch: '#0f7a4a', accent: '#2db87a', navy: '#0b211a' },
  { id: 'ember', name: 'Ember', description: 'Warm terracotta for collections desks.', swatch: '#c2410c', accent: '#ea580c', navy: '#1c0f0b' },
  { id: 'graphite', name: 'Graphite', description: 'Cool slate for finance work.', swatch: '#334155', accent: '#64748b', navy: '#0f172a' },
  { id: 'orchid', name: 'Orchid', description: 'Quiet violet for a calmer workspace.', swatch: '#6d28d9', accent: '#8b5cf6', navy: '#1e0b3d' },
];
